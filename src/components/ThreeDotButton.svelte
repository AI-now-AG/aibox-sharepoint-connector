<script lang="ts">
  import { svgIcons } from "$assets/icons";

  interface Props {
    action?: Function;
  }

  let { action }: Props = $props();
</script>

<div
  role="button"
  tabindex="0"
  class="btn btn-ghost btn-sm"
  onclick={(e) => {
    e.stopPropagation();
    action?.();
  }}
>
  <span class="pointer-events-none">
    {@html svgIcons.threeDot}
  </span>
</div>
