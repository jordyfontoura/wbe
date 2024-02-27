<script lang="ts">
  import { invoke } from "@tauri-apps/api/tauri";
  import File from "./lib/File.svelte";
  import { getContext, onMount, setContext } from "svelte";
  import { writable } from "svelte/store";
  import type { ChangeEventHandler, EventHandler } from "svelte/elements";
  import { getMatches, type CliMatches } from "@tauri-apps/api/cli";

  let files: ICompleteFileInfo[] = [];
  const config = writable<IUserConfig | null>(null);
  const session = writable<ISession | null>(null);

  setContext('config', config);
  setContext('session', session);
  setContext('navigation', { up, back, goto });

  session.subscribe(listFiles);

  onMount(loadConfig);

  async function setupConfig() {
    console.log('Loading config');
    const raw = await fetch('/config.json');
    const newConfig = (await raw.json()) as IUserConfig;

    config.set(newConfig);

    console.log('Config loaded', newConfig);
  }

  async function setupSession() {
    let { args: { directory: { value }}} = await getMatches();
    let homedir = value ? value.toString() : await invoke<string>("get_homedir");

    session.set({
      path: homedir,
      history: [],
    });

    console.log('Session', session);
  }

  async function loadConfig() {
    await setupConfig();
    await setupSession();
  }

  function completeFile(file: IFileInfo): ICompleteFileInfo {
    if (!$config) throw new Error('Config not loaded');

    let icon: string =
      file.kind === 'file'
        ? $config.icons.files.default
        : $config.icons.folders.default;

    const associations =
      file.kind === 'file'
        ? $config.icons.files.associations
        : $config.icons.folders.associations;
    for (const [iconName, patterns] of Object.entries(associations)) {
      if (
        patterns.some((pattern) => new RegExp(pattern, 'i').test(file.filename))
      ) {
        icon = iconName;
        break;
      }
    }

    return {
      ...file,
      icon: `/icons/${icon}.svg`,
    };
  }

  async function listFiles() {
    console.log('Listing files ...');
    if (!$config) return;

    console.log('Listing files!', $session);

    const response = await invoke<IFileInfo[]>('list_files', {
      path: $session?.path || '..',
      orderBy: 'Name',
    });

    files = response.map(completeFile);
  }

  function up() {
    if (!$session) return;

    session.update((s: ISession | null) => {
      if (!s) return s;

      const newPath = s.path.split('/').slice(0, -1).join('/');
      return { ...s, path: newPath, history: [...s.history, s.path] };
    });
  }

  function back() {
    if (!$session) return;

    session.update((s: ISession | null) => {
      if (!s) return s;

      const newPath = s.history.pop() || s.path;
      return { ...s, path: newPath, history: s.history };
    });
  }

  function goto(path: string) {
    session.update((s: ISession | null) => {
      if (!s) return s;

      return { ...s, path, history: [...s.history, s.path] };
    });

    if (
      document.activeElement != document.body &&
      document.activeElement &&
      document.activeElement instanceof HTMLElement
    ) {
      document.activeElement.blur();
    }
  }

  async function tryGoto(path: string) {
    const response = await invoke<boolean>('is_folder', { path });
    if (response) goto(path);

    console.log('Not a directory');
  }

  const handlePathChanged: ChangeEventHandler<HTMLInputElement> = (ev) => {
    const path = ev.currentTarget.value;
    if (!path) return;
    tryGoto(path);
  };
</script>

<div class="container">
  <div class="header">
    <button class="back" on:click={back} title="go back">Back</button>
    <input
      type="text"
      value={$session?.path}
      class="path"
      on:change={handlePathChanged}
      on:input={handlePathChanged}
    />
    <button class="up" on:click={up} title="go to the above folder"
      >Above</button
    >
  </div>
  <main class="content">
    <ul class="files">
      {#each files as file}
        <File info={file} />
      {/each}
    </ul>
  </main>
</div>
