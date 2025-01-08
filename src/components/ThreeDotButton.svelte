<script lang="ts">
  import { svgIcons } from "$assets/icons";

  export let action: Function = () => null;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  role="button"
  tabindex="0"
  class="btn btn-ghost btn-sm"
  on:click|stopPropagation={() => {
    action();
  }}
>
  <span class="pointer-events-none">
    {@html svgIcons.threeDot}
  </span>
</div>
