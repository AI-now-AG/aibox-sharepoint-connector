<script lang="ts">
  import { svgIcons } from "$assets/icons";
  import { fade } from "svelte/transition";

  interface Props {
    type?: string;
    dismissible?: boolean;
    dismiss?: any;
    children?: import("svelte").Snippet;
  }

  let {
    type = "error",
    dismissible = true,
    dismiss,
    children,
  }: Props = $props();
</script>

<div role="alert" class="absolute right-4 bottom-4 alert alert-success" transition:fade>
  <span class="icon">
    {#if type === "success"}
      {@html svgIcons.toastSuccess}
    {:else if type === "error"}
      {@html svgIcons.toastError}
    {:else}
      {@html svgIcons.toastInfo}
    {/if}
  </span>
  <div class="text">
    {@render children?.()}
  </div>
  {#if dismissible}
    <button class="close" onclick={() => dismiss()} aria-label="Close">
      {@html svgIcons.close}
    </button>
  {/if}
</div>
