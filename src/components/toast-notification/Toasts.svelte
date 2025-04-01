<script lang="ts">
  import Toast from "./Toast.svelte";
  import { dismissToast, toasts } from "$stores/toast";
</script>

{#if $toasts}
  <div
    class="flex flex-col fixed justify-center right-0 bottom-0 w-full z-1000"
  >
    {#each $toasts as toast (toast.id)}
      <Toast
        type={toast.type}
        dismissible={toast.dismissible}
        dismiss={() => dismissToast(toast.id ?? 0)}>{@html toast.message}</Toast
      >
    {/each}
  </div>
{/if}
