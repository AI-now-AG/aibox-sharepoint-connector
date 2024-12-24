<script lang="ts">
  import { svgIcons } from "$assets/icons";

  export let action: Function = () => null;
</script>

<button
  tabindex="0"
  class="btn btn-ghost btn-sm hover:bg-slate-200 hover:text-black"
  on:click|stopPropagation={() => {
    action();
  }}
>
  <span class="pointer-events-none">
    {@html svgIcons.threeDot}
  </span>
</button>
