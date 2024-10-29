<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { svgIcons } from "$assets/icons";

  const dispatch = createEventDispatcher();

  export let show: boolean = false;

  function toggle() {
    show = !show;

    dispatch("change", { show });
  }
</script>

<button on:click={toggle}>
  {#if show}
    {@html svgIcons.eye}
  {:else}
    {@html svgIcons.eyeClose}
  {/if}
</button>
