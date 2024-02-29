<script lang="ts">
  import File from './lib/File.svelte';
  import { onMount, setContext, onDestroy } from 'svelte';
  import {
    get,
    writable,
    derived,
    type Writable,
    readonly,
  } from 'svelte/store';
  import type { ChangeEventHandler } from 'svelte/elements';
  import type { ICompleteFileInfo, IUserConfig, ICustomEvent } from './types';
  import { useShortcuts } from './services/shortcuts';
  import { setupConfig, useNavigation } from './app';
  import { useSessions } from './store/sessions';
  import { searchFiles } from './store/files';

  const shortcuts = useShortcuts();
  const files: Writable<ICompleteFileInfo[]> = writable([]);
  const config = writable<IUserConfig | null>(null);
  const selections = writable<string[]>([]);
  const {
    currentSession,
    currentIndex: currentSessionIndex,
    sessions,
    ...sessionsContext
  } = useSessions(derived(config, ($config) => $config!.defaultPath));
  const navigator = useNavigation(currentSession);
  let setupPromise: Promise<void> | null = null;

  setContext('config', config);

  onMount(() => {
    setupPromise = handleSetup();
    currentSession.subscribe((session) => {
      console.log('session changed', session);
      session.subscribe(handleListFiles);
    });
  });

  onDestroy(() => {
    shortcuts.unsubscribeAll();
  });

  async function handleSetup() {
    console.log('handleSetup');
    await setupConfig(config);
    sessionsContext.setup();
    await registerShortcuts();
    handleListFiles();
    console.log('handleSetup done');
  }

  async function registerShortcuts() {
    shortcuts.subscribe(['Control', 'a'], selectAllFiles);
    shortcuts.subscribe(['Control', 'i'], invertSelection);
  }

  function handleListFiles() {
    const readonlySession = readonly(get(currentSession));
    searchFiles(config, readonlySession)
      .then((receivedFiles) => {
        files.set(receivedFiles);
      })
      .catch((error) => console.error('Failed to list files', error));
  }

  const handlePathChanged: ChangeEventHandler<HTMLInputElement> = (ev) => {
    const path = ev.currentTarget.value;
    if (!path) return;

    navigator.tryGoto(path);
  };

  function handleBack() {
    navigator.back();
  }

  function handleUp() {
    navigator.up();
  }

  function handleOpen(
    customEvent: CustomEvent<ICustomEvent<ICompleteFileInfo, MouseEvent>>,
  ) {
    const { data: fileInfo } = customEvent.detail;

    if (fileInfo.kind !== 'directory') {
      alert(`Only folders can be opened, not ${fileInfo.kind}`);
      return;
    }

    navigator.goto(fileInfo.path);
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
    sessionsContext.add();
  }

  function handleCloseTab() {
    sessionsContext.remove();
  }

  function handleNavigateTab(id: number) {
    sessionsContext.setCurrent(id);
  }

  $: tabs = $sessions.map((session, index) => ({
    name: index.toString(),
    path: get(session).path,
    active: index === $currentSessionIndex,
    click: () => handleNavigateTab(index),
  }));
</script>

{#await setupPromise}
  <div>Loading...</div>
{:then}
  {#if !$config}
    <div>Loading Config...</div>
  {:else}
    <div class="container">
      <div class="tabs">
        {#each tabs as tab}
          <button on:click={tab.click} class="tab" class:active={tab.active}
            >{tab.name}</button
          >
        {/each}
      </div>
      <div class="header">
        <button class="back" on:click={handleBack} title="go back">
          Back
        </button>
        <input
          type="text"
          value={get(get(currentSession)).path}
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
  {/if}
{/await}
