<script lang="ts">
  import { invoke } from "@tauri-apps/api/tauri";
  import File from "./lib/File.svelte";
  import { getContext, onMount, setContext } from "svelte";
  import { writable } from "svelte/store";

  let files: ICompleteFileInfo[] = [];
  const config = writable<IUserConfig | null>(null);
  const session = writable<ISession | null>(null);

  setContext("config", config);
  setContext("session", session);

  session.subscribe(listFiles);

  loadConfig();


  async function setupConfig() {
    console.log("Loading config");
    const raw = await fetch("/config.json");
    const newConfig = (await raw.json()) as IUserConfig;

    config.set(newConfig);

    console.log("Config loaded", newConfig);
  }

  async function setupSession() {
    const homedir = await invoke<string>("get_homedir");

    session.set({
      path: homedir,
    });

    console.log("Session", session);
  }

  async function loadConfig() {
    setupConfig();
    setupSession();
  }

  function completeFile(file: IFileInfo): ICompleteFileInfo {
    if (!$config) throw new Error("Config not loaded");

    let icon: string =
      file.kind === "file"
        ? $config.icons.files.default
        : $config.icons.folders.default;

    const associations =
      file.kind === "file"
        ? $config.icons.files.associations
        : $config.icons.folders.associations;
    for (const [iconName, patterns] of Object.entries(associations)) {
      if (
        patterns.some((pattern) => new RegExp(pattern, "i").test(file.filename))
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
    if (!$config) return;

    const response = await invoke<IFileInfo[]>("list_files", {
      path: $session?.path || "..",
      orderBy: "Name",
    });

    files = response.map(completeFile);
  }
</script>

<div class="container">
  <form class="row" on:submit|preventDefault={listFiles}>
    <button type="submit">Listar Arquivos</button>
  </form>
  <ul class="files">
    {#each files as file}
      <File info={file} />
    {/each}
  </ul>
</div>
