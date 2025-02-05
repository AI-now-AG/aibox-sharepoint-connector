<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { svgIcons } from "$assets/icons";

  const dispatch = createEventDispatcher();

  interface Props {
    show?: boolean;
  }

  let { show = $bindable(false) }: Props = $props();

  function toggle() {
    show = !show;

    dispatch("change", { show });
  }
</script>

<button onclick={toggle}>
  {#if show}
    {@html svgIcons.eye}
  {:else}
    {@html svgIcons.eyeClose}
  {/if}
</button>
