<!-- LoadingSpinner.svelte -->
<script lang="ts">
  interface Props {
    isLoading?: boolean;
  }

  let { isLoading = $bindable(false) }: Props = $props();
</script>

{#if isLoading}
  <div
    class="fixed inset-0 bg-base-content/80 flex items-center justify-center z-50"
  >
    <svg
      class="animate-spin h-10 w-10 text-neutral"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v1a7 7 0 00-7 7H4z"
      />
    </svg>
  </div>
{/if}
