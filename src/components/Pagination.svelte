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
    page = p;
    onPageChange?.(p);
  }

  function getVisiblePages() {
    const delta = 2; // pages around current page
    const range: (number | string)[] = [];

    const start = Math.max(2, page - delta);
    const end = Math.min(totalPages - 1, page + delta);

    range.push(1);

    if (start > 2) {
      range.push("...");
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    if (end < totalPages - 1) {
      range.push("...");
    }

    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
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

      {#each getVisiblePages() as p}
        {#if p === "..."}
          <button class="join-item btn btn-sm btn-disabled">...</button>
        {:else}
          <button
            class="join-item btn btn-sm {page === p
              ? 'btn-primary pointer-events-none'
              : ''}"
            onclick={() => goTo(p as number)}
          >
            {p}
          </button>
        {/if}
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
