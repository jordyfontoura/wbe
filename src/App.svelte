<script lang="ts">
  import File from './lib/File.svelte';
  import { onMount, setContext } from 'svelte';
  import { writable, type Writable } from 'svelte/store';
  import type { ChangeEventHandler } from 'svelte/elements';
  import type { ICompleteFileInfo, IUserConfig, ISession, ISessionCollection } from './types';
  import { listFiles, setup, useNavigation, useTabNavigation } from './app';

  const files: Writable<ICompleteFileInfo[]> = writable([]);
  const config = writable<IUserConfig | null>(null);
  const session = writable<ISession | null>(null);
  const sessions = writable<ISessionCollection>({sessions: []});
  const navigation = useNavigation(session);
  const tabNavigation = useTabNavigation(session, sessions);

  setContext('config', config);
  setContext('sessions', sessions);
  setContext('session', session); // Talvez faça sentido mudar o nome do contexto para current Session ou algo do tipo.
  setContext('navigation', navigation);
  setContext('tabNavigation', tabNavigation);

  session.subscribe(handleListFiles);

  onMount(handleSetup);

  function handleSetup() {
    setup(config, session, sessions);
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

  function handleNewTab(){
    tabNavigation.create(null);
  }

  function handleCloseTab(){
    if(!$session) return;
    tabNavigation.close($session.id);
  }

  function handleNavigateTab(id: number){
    tabNavigation.navigate(id)
  }

</script>

<div class="container">
  <div class="tabs">
    {#each $sessions.sessions as tab}
      <button on:click={()=>handleNavigateTab(tab.id)} class={tab.current ? "tab-active": "up"}>{tab.id}</button>
    {/each}
  </div>
  <div class="header">
    <button class="back" on:click={handleBack} title="go back">
      Back
    </button>
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
    <ul class="files">
      {#each $files as file}
        <File info={file} />
      {/each}
    </ul>
  </main>

  <div id="plugins"></div>
</div>
