<script lang="ts">
  import { svgIcons } from "$assets/icons";
  import { getTranscriptionConfig } from "$api/transcription/transcription-api";

  interface Props {
    dataSourceId: string;
    dataSourceName: string;
  }

  let { dataSourceId, dataSourceName }: Props = $props();

  interface Chunk {
    _id: string;
    chunk_index: number;
    content: string;
    token_count: number;
    metadata: {
      page_number?: number;
      section_title?: string;
    };
  }

  let dialog: HTMLDialogElement;
  let chunks = $state<Chunk[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let totalChunks = $state(0);
  let currentPage = $state(1);
  const pageSize = 10;

  // API base URL - will be set from config
  let apiBase = $state("");

  // Track the last loaded dataSourceId to detect changes
  let lastLoadedId = $state<string | null>(null);

  export function open() {
    dialog?.showModal();
    // Fetch chunks if this is a different data source or chunks are empty
    if (dataSourceId !== lastLoadedId || chunks.length === 0) {
      // Reset state for new data source
      chunks = [];
      currentPage = 1;
      totalChunks = 0;
      error = null;
      lastLoadedId = dataSourceId;
      fetchChunks();
    }
  }

  export function close() {
    dialog?.close();
  }

  async function fetchChunks() {
    loading = true;
    error = null;

    try {
      // Get API base URL from config if not already set
      if (!apiBase) {
        const config = await getTranscriptionConfig();
        apiBase = config.apiUrl;
      }

      const offset = (currentPage - 1) * pageSize;
      const response = await fetch(
        `${apiBase}/api/vector-kb/data-sources/${dataSourceId}/chunks?limit=${pageSize}&offset=${offset}`,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const result = await response.json();

      if (result.success) {
        chunks = result.data.chunks || [];
        // Backend returns total in pagination.total, not data.total
        totalChunks = result.data.pagination?.total || result.data.total || 0;
      } else {
        error = result.error || "Failed to fetch chunks";
      }
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  function handlePageChange(page: number) {
    currentPage = page;
    fetchChunks();
  }

  const totalPages = $derived(Math.ceil(totalChunks / pageSize));
</script>

<dialog bind:this={dialog} class="modal">
  <div class="modal-box w-11/12 max-w-4xl max-h-[90vh]">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-lg font-bold">Chunks Viewer</h3>
        <p class="text-sm text-base-content/60">{dataSourceName}</p>
      </div>
      <button class="btn btn-sm btn-circle btn-ghost" onclick={() => close()}>
        {@html svgIcons.closeMenu}
      </button>
    </div>

    {#if loading}
      <div class="flex items-center justify-center py-12">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
    {:else if error}
      <div class="alert alert-error">
        <span>{error}</span>
      </div>
    {:else if chunks.length === 0}
      <div class="text-center py-12">
        <p class="text-base-content/60">No chunks found for this file</p>
      </div>
    {:else}
      <div class="mb-4 text-sm text-base-content/60">
        Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalChunks)} of {totalChunks} chunks
      </div>

      <div class="space-y-4 max-h-[50vh] overflow-y-auto">
        {#each chunks as chunk}
          <div class="card bg-base-200">
            <div class="card-body p-4">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="badge badge-primary">Chunk {chunk.chunk_index + 1}</span>
                  <span class="badge badge-ghost">{chunk.content.length} chars</span>
                  {#if chunk.metadata?.page_number}
                    <span class="badge badge-outline">Page {chunk.metadata.page_number}</span>
                  {/if}
                </div>
              </div>
              {#if chunk.metadata?.section_title}
                <p class="text-sm font-medium text-base-content/80 mb-1">
                  {chunk.metadata.section_title}
                </p>
              {/if}
              <div class="bg-base-100 p-3 rounded-lg">
                <pre class="whitespace-pre-wrap text-sm font-mono overflow-x-auto">{chunk.content}</pre>
              </div>
            </div>
          </div>
        {/each}
      </div>

      <!-- Pagination -->
      {#if totalPages > 1}
        <div class="flex justify-center mt-4">
          <div class="join">
            <button
              class="join-item btn btn-sm"
              disabled={currentPage === 1}
              onclick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </button>
            {#each Array(Math.min(totalPages, 5)) as _, i}
              {@const page = currentPage <= 3
                ? i + 1
                : currentPage >= totalPages - 2
                  ? totalPages - 4 + i
                  : currentPage - 2 + i}
              {#if page > 0 && page <= totalPages}
                <button
                  class="join-item btn btn-sm"
                  class:btn-active={page === currentPage}
                  onclick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              {/if}
            {/each}
            <button
              class="join-item btn btn-sm"
              disabled={currentPage === totalPages}
              onclick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      {/if}
    {/if}

    <div class="modal-action">
      <button class="btn" onclick={() => close()}>Close</button>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
