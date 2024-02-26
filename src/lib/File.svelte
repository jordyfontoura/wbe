<script lang="ts">
  import { getContext } from "svelte";
  import type { Writable } from "svelte/store";
  import { sendNotification } from "@tauri-apps/api/notification";

  export let info: ICompleteFileInfo;

  const session = getContext<Writable<ISession>>("session");

  function openFile() {
    if (info.kind === 'file') {
      sendNotification({
        title: "Error",
        body: `${info.path} is a file, not a folder.`,
      });
      return;
    }

    console.log("Opening", info.path);
    session.update((s) => ({ ...s, path: info.path }));
  }
</script>

<button class="file" on:dblclick={openFile}>
  <img src={info.icon} alt={info.path} class="file-image" />
  <p class="file-name">{info.filename}</p>
</button>
