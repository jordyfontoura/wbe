<script lang="ts">
  import File from './lib/File.svelte';
  import { onMount, setContext, onDestroy } from 'svelte';
  import { writable, type Writable } from 'svelte/store';
  import type { ChangeEventHandler } from 'svelte/elements';
  import type {
    ICompleteFileInfo,
    IUserConfig,
    ISession,
    ICustomEvent,
    ISessionCollection,
  } from './types';
  import { listFiles, setup, useNavigation, useTabNavigation } from './app';
  import { useShortcuts } from './services/shortcuts';

  const files: Writable<ICompleteFileInfo[]> = writable([]);
  const config = writable<IUserConfig | null>(null);
  const session = writable<ISession | null>(null);
  const sessions = writable<ISessionCollection>({ sessions: [] });
  const navigation = useNavigation(session);
  const selections = writable<string[]>([]);
  const tabNavigation = useTabNavigation(session, sessions);
  const shortcuts = useShortcuts();

  setContext('config', config);
  setContext('sessions', sessions);
  setContext('session', session); // Talvez faça sentido mudar o nome do contexto para current Session ou algo do tipo.
  setContext('navigation', navigation);
  setContext('tabNavigation', tabNavigation);

  session.subscribe(handleListFiles);

  onMount(handleSetup);

  onDestroy(() => {
    shortcuts.unsubscribeAll();
  });

  async function handleSetup() {
    console.log('handleSetup');
    await setup(config, session, sessions);
    await registerShortcuts();
  }

  async function registerShortcuts() {
    shortcuts.subscribe(['Control', 'a'], selectAllFiles);
    shortcuts.subscribe(['Control', 'i'], invertSelection);
  }

  function handleListFiles() {
    listFiles(config, session, files);
  }

  const handlePathChanged: ChangeEventHandler<HTMLInputElement> = (ev) => {
    const path = ev.currentTarget.value;
    if (!path) return;
    navigation.tryGoto(path);
  };

  function handleBack() {
    navigation.back();
  }

  function handleUp() {
    navigation.up();
  }

  function handleOpen(
    customEvent: CustomEvent<ICustomEvent<ICompleteFileInfo, MouseEvent>>,
  ) {
    const { data: fileInfo } = customEvent.detail;

    if (fileInfo.kind !== 'directory') {
      alert(`Only folders can be opened, not ${fileInfo.kind}`);
      return;
    }

    navigation.goto(fileInfo.path);
  }

  function handleFileContextMenu(
    customEvent: CustomEvent<ICustomEvent<ICompleteFileInfo, MouseEvent>>,
  ) {
    customEvent.detail.originalEvent.stopPropagation();

    alert(
      `Context menu for ${customEvent.detail.data.path} is not implemented yet`,
    );
  }

  function handleFileSelect(
    customEvent: CustomEvent<ICustomEvent<ICompleteFileInfo, MouseEvent>>,
  ) {
    const { data: fileInfo, originalEvent: event } = customEvent.detail;
    const ctrl = event.ctrlKey;
    const shift = event.shiftKey;

    if (!ctrl && !shift) {
      selections.set([fileInfo.path]);
      return;
    }

    if (shift) {
      const selectedIndex = $files.findIndex(
        (file) => file.path === fileInfo.path,
      );
      const lastSelectedIndex = $files.findIndex(
        (file) => file.path === $selections[0],
      );
      const start = Math.min(selectedIndex, lastSelectedIndex);
      const end = Math.max(selectedIndex, lastSelectedIndex);
      selections.set($files.slice(start, end + 1).map((file) => file.path));
      return;
    }

    if (ctrl) {
      if ($selections.includes(fileInfo.path)) {
        selections.set($selections.filter((path) => path !== fileInfo.path));
      } else {
        selections.set([...$selections, fileInfo.path]);
      }
    }
  }

  function invertSelection() {
    const selected = new Set($selections);
    const unselected = $files.filter((file) => !selected.has(file.path));
    const newSelections = unselected.map((file) => file.path);
    selections.set(newSelections);
  }

  function selectAllFiles() {
    selections.set($files.map((file) => file.path));
  }

  function deselectAllFiles() {
    selections.set([]);
  }

  function handleDeselectAllFiles(
    ev: MouseEvent & { currentTarget: EventTarget & HTMLElement },
  ) {
    const target = ev.target as HTMLElement;

    if (target.classList.contains('files')) {
      deselectAllFiles();
    }
  }
  function handleNewTab() {
    tabNavigation.create(null);
  }

  function handleCloseTab() {
    if (!$session) return;
    tabNavigation.close($session.id);
  }

  function handleNavigateTab(id: number) {
    tabNavigation.navigate(id);
  }
</script>

<div class="container">
  <div class="tabs">
    {#each $sessions.sessions as tab}
      <button
        on:click={() => handleNavigateTab(tab.id)}
        class={tab.current ? 'tab-active' : 'up'}>{tab.id}</button
      >
    {/each}
  </div>
  <div class="header">
    <button class="back" on:click={handleBack} title="go back"> Back </button>
    <input
      type="text"
      value={$session?.path}
      class="path"
      on:change={handlePathChanged}
      on:input={handlePathChanged}
    />
    <button class="up" on:click={handleUp} title="go to the above folder"
      >Above</button
    >
    <button class="up" on:click={handleCloseTab} title="close current tab"
      >Close tab</button
    >
    <button class="up" on:click={handleNewTab} title="add new tab"
      >New tab</button
    >
  </div>
  <main class="content">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <ul class="files" on:click={handleDeselectAllFiles}>
      {#each $files as file}
        <File
          info={file}
          selected={$selections.includes(file.path)}
          on:open={handleOpen}
          on:contextmenu={handleFileContextMenu}
          on:select={handleFileSelect}
        />
      {/each}
    </ul>
  </main>

  <div id="plugins"></div>
</div>
