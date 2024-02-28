<script lang="ts">
  import File from './lib/File.svelte';
  import { onMount, setContext } from 'svelte';
  import { writable, type Writable } from 'svelte/store';
  import type { ChangeEventHandler } from 'svelte/elements';
  import type { ICompleteFileInfo, IUserConfig, ISession } from './types';
  import { listFiles, setup, useNavigation } from './app';
  import { useKeyboard } from './services/keyboard';

  const files: Writable<ICompleteFileInfo[]> = writable([]);
  const config = writable<IUserConfig | null>(null);
  const session = writable<ISession | null>(null);
  const navigation = useNavigation(session);
  const selections = writable<string[]>([]);
  const keyboard = useKeyboard();

  setContext('config', config);
  setContext('session', session);
  setContext('navigation', navigation);

  session.subscribe(handleListFiles);
  keyboard.subscribeShortcut('Control+a', selectAllFiles);
  keyboard.subscribeShortcut('Control+i', invertSelection);

  onMount(handleSetup);

  function handleSetup() {
    setup(config, session);
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

  function handleOpen(event: CustomEvent<ICompleteFileInfo>) {
    const fileInfo = event.detail;

    if (fileInfo.kind !== 'folder') {
      alert('Only folders can be opened');
      return;
    }

    navigation.goto(fileInfo.path);
  }

  function handleFileContextMenu(event: CustomEvent<ICompleteFileInfo>) {
    event.stopPropagation();

    alert(`Context menu for ${event.detail.path} is not implemented yet`);
  }

  function handleFileSelect(event: CustomEvent<ICompleteFileInfo>) {
    const fileInfo = event.detail;
    const ctrl = keyboard.isPressed('Control');
    const shift = keyboard.isPressed('Shift');

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
</script>

<div class="container">
  <div class="header">
    <button class="back" on:click={handleBack} title="go back">Back</button>
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

<svelte:window
  on:keydown|preventDefault={keyboard.onKeyDown}
  on:keyup|preventDefault={keyboard.onKeyUp}
/>
