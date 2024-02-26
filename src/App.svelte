<script lang="ts">
  import { invoke } from "@tauri-apps/api/tauri"
  import File from "./lib/File.svelte";

  let files: FileInfo[] = [];

  async function listFiles(){
    const response = await invoke<FileInfo[]>("list_files")

    files = response;
  }
</script>

<div class="container">
  <form class="row" on:submit|preventDefault={listFiles}>
    <button type="submit">Listar Arquivos</button>
  </form>
  <ul>
    {#each files as file}
      <File name={file.name} ext={file.ext} />
    {/each}
  </ul>

</div>