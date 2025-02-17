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
      <svg
        width="0.5em"
        style="text-align: center; display: inline-block;"
        aria-hidden="true"
        focusable="false"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 352 512"
      >
        <path
          fill="currentColor"
          d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"
        />
      </svg>
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
