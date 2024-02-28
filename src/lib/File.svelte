<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ICompleteFileInfo, ICustomEvent } from '../types';

  export let info: ICompleteFileInfo;
  export let selected = false;

  const dispatch = createEventDispatcher<{
    select: ICustomEvent<ICompleteFileInfo, MouseEvent>;
    open: ICustomEvent<ICompleteFileInfo, MouseEvent>;
    contextmenu: ICustomEvent<ICompleteFileInfo, MouseEvent>;
  }>();

  function handleSelect(event: MouseEvent) {
    dispatch('select', { originalEvent: event, data: info});
  }

  function handleDblClick(event: MouseEvent) {
    dispatch('open', {originalEvent: event, data: info});
  }

  function handleContextMenu(event: MouseEvent) {
    dispatch('contextmenu', {originalEvent: event, data: info});
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
