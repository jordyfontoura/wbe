<script lang="ts">
  import File from './lib/File.svelte';
  import { onMount, setContext } from 'svelte';
  import { writable, type Writable } from 'svelte/store';
  import type { ChangeEventHandler } from 'svelte/elements';
  import type { ICompleteFileInfo, IUserConfig, ISession } from './types';
  import { listFiles, setup, useNavigation } from './app';

  let files: Writable<ICompleteFileInfo[]> = writable([]);
  const config = writable<IUserConfig | null>(null);
  const session = writable<ISession | null>(null);
  const navigation = useNavigation(session);

  setContext('config', config);
  setContext('session', session);
  setContext('navigation', navigation);

  session.subscribe(handleListFiles);

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
    <ul class="files">
      {#each $files as file}
        <File info={file} />
      {/each}
    </ul>
  </main>

  <div id="plugins"></div>
</div>
