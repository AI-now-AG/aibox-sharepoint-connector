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

<article class="rounded-lg {type}" role="alert" transition:fade>
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
</article>

<style>
  article {
    color: #000;
    padding: 1rem;
    display: flex;
    align-items: center;
    margin: 0 0.5rem 0.5rem auto;
    min-width: 30rem;
  }
  .error {
    background: #ff6f70;
  }
  .success {
    background: #00ca92;
  }
  .info {
    background: #00b3f0;
  }
  .icon {
    display: inline-flex;
    width: 1.5rem;
  }
  .text {
    margin-left: 0.5rem;
    margin-right: 0.5rem;
  }
  button {
    background: transparent;
    border: 0 none;
    padding: 0;
    margin: 0 0 0 auto;
    line-height: 1;
    font-size: 1rem;
  }
</style>
