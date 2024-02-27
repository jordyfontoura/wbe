<script lang="ts">
  import { getContext } from 'svelte';
  import type { ICompleteFileInfo, INavigation } from '../types';

  export let info: ICompleteFileInfo;

  const navigation = getContext<INavigation>('navigation');

  function openFile() {
    alert('Not implemented yet');
  }

  function openFolder() {
    navigation.goto(info.path);
  }

  const open = info.kind === 'file' ? openFile : openFolder;
</script>

<button class="file" on:dblclick={open}>
  <img src={info.icon} alt={info.path} class="file-image" />
  <p class="file-name">{info.filename}</p>
</button>
