<script lang="ts">
  import { svgIcons } from "$assets/icons";

  interface Props {
    show?: boolean;
    change: () => void;
  }

  let { show = $bindable(false), change }: Props = $props();

  function toggle() {
    show = !show;
    change();
  }
</script>

<button onclick={toggle}>
  {#if show}
    {@html svgIcons.eye}
  {:else}
    {@html svgIcons.eyeClose}
  {/if}
</button>
