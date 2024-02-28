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
  } from './types';
  import { listFiles, setup, useNavigation } from './app';
  import {
    isRegistered,
    register as registerShortcut,
    unregister,
    unregisterAll,
  } from '@tauri-apps/api/globalShortcut';

  const files: Writable<ICompleteFileInfo[]> = writable([]);
  const config = writable<IUserConfig | null>(null);
  const session = writable<ISession | null>(null);
  const navigation = useNavigation(session);
  const selections = writable<string[]>([]);

  setContext('config', config);
  setContext('session', session);
  setContext('navigation', navigation);

  session.subscribe(handleListFiles);

  onMount(handleSetup);

  onDestroy(() => {
    unregisterAll();
  });

  async function handleSetup() {
    console.log('handleSetup');
    await setup(config, session);
    await registerShortcuts();
  }

  async function registerShortcuts() {
    try {
      if (await isRegistered('Control+a')) {
        await unregister('Control+a');
      }
      if (await isRegistered('Control+i')) {
        await unregister('Control+i');
      }

      await registerShortcut('Control+a', selectAllFiles);
      await registerShortcut('Control+i', invertSelection);
    } catch (error) {
      console.error('Failed to register shortcuts', error);
    }
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
