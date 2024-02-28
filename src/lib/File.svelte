<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ICompleteFileInfo } from '../types';

  export let info: ICompleteFileInfo;
  export let selected = false;

  const dispatch = createEventDispatcher<{
    select: ICompleteFileInfo;
    open: ICompleteFileInfo;
    contextmenu: ICompleteFileInfo;
  }>();

  function handleSelect() {
    dispatch('select', info);
  }

  function handleDblClick() {
    dispatch('open', info);
  }

  function handleContextMenu() {
    dispatch('contextmenu', info);
  }
</script>

<button
  class="file"
  class:selected={selected}
  on:dblclick={handleDblClick}
  on:click={handleSelect}
  on:contextmenu={handleContextMenu}
>
  <img src={info.icon} alt={info.path} class="file-image" />
  <p class="file-name">{info.filename}</p>
</button>
