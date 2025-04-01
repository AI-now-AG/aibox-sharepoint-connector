<script lang="ts">
  import { svgIcons } from "$assets/icons";
  import { fade } from "svelte/transition";

  // Define the available toast types for type safety
  type ToastType = "success" | "error" | "info";

  interface Props {
    type?: ToastType | undefined;
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

<div
  role="alert"
  class="absolute right-4 bottom-4 alert alert-{type}"
  transition:fade
>
  <span class="icon">
    {@html svgIcons[
      type === "success"
        ? "toastSuccess"
        : type === "error"
          ? "toastError"
          : "toastInfo"
    ]}
  </span>
  <div class="text">
    {@render children?.()}
  </div>
  {#if dismissible}
    <button
      class="close"
      onclick={() => dismiss()}
      aria-label="Close"
      title="Close notification"
    >
      {@html svgIcons.close}
    </button>
  {/if}
</div>
