<script lang="ts">
  interface Props {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: Function;
  }

  let { page = $bindable(1), pageSize, total, onPageChange }: Props = $props();
  let totalPages = $state(1);

  $effect(() => {
    totalPages = Math.max(1, Math.ceil(total / pageSize));
  });

  function goTo(p: number) {
    if (p < 1 || p > totalPages) return;

    page = p; // update bound state
    onPageChange?.(p); // 🔥 emit event
  }
</script>

{#if totalPages > 1}
  <div class="flex justify-center mt-4">
    <div class="join">
      <!-- Prev -->
      <button
        class="join-item btn btn-sm"
        disabled={page === 1}
        onclick={() => goTo(page - 1)}
      >
        «
      </button>

      <!-- Page numbers -->
      {#each Array(totalPages) as _, i}
        <button
          class="join-item btn btn-sm {page === i + 1
            ? 'btn-primary pointer-events-none'
            : ''}"
          onclick={() => goTo(i + 1)}
        >
          {i + 1}
        </button>
      {/each}

      <!-- Next -->
      <button
        class="join-item btn btn-sm"
        disabled={page === totalPages}
        onclick={() => goTo(page + 1)}
      >
        »
      </button>
    </div>
  </div>
{/if}
