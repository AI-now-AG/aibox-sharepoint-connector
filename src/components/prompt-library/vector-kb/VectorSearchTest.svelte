<script lang="ts">
  import type { SourceAttribution } from "$types/MessageHistory";

  interface Props {
    tenantId: string;
  }

  let { tenantId }: Props = $props();

  let query = $state("");
  let topK = $state(5);
  let threshold = $state(0.7);
  let searching = $state(false);
  let results = $state<SourceAttribution[]>([]);
  let error = $state<string | null>(null);
  let searchTime = $state<number | null>(null);

  const apiBase = import.meta.env.PUBLIC_TRANSCRIPTION_SERVICE_DOMAIN || "";

  async function performSearch() {
    if (!query.trim()) {
      error = "Please enter a search query";
      return;
    }

    searching = true;
    error = null;
    results = [];
    searchTime = null;

    const startTime = performance.now();

    try {
      const response = await fetch(`${apiBase}/api/vector-kb/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          query: query.trim(),
          topK,
          threshold,
        }),
      });

      const result = await response.json();
      const endTime = performance.now();
      searchTime = Math.round(endTime - startTime);

      if (result.success) {
        results = result.data.map((item: any) => ({
          fileName: item.fileName || item.original_file_name || "Unknown",
          score: item.score || item.similarity || 0,
          pageNumber: item.pageNumber || item.metadata?.page_number,
          snippet: item.snippet || item.content || "",
          chunkIndex: item.chunkIndex ?? item.chunk_index,
        }));
      } else {
        error = result.error || "Search failed";
      }
    } catch (e) {
      error = (e as Error).message;
    } finally {
      searching = false;
    }
  }

  function formatScore(score: number): string {
    return (score * 100).toFixed(1) + "%";
  }

  function getScoreColor(score: number): string {
    if (score >= 0.9) return "badge-success";
    if (score >= 0.8) return "badge-info";
    if (score >= 0.7) return "badge-warning";
    return "badge-ghost";
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      performSearch();
    }
  }
</script>

<div class="card bg-base-100 shadow-lg">
  <div class="card-body">
    <h2 class="card-title">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      Vector Search Test
    </h2>
    <p class="text-sm text-base-content/60">Test semantic search across your Vector Knowledge Base</p>

    <div class="divider my-2"></div>

    <!-- Search Input -->
    <div class="form-control">
      <label class="label">
        <span class="label-text font-medium">Search Query</span>
      </label>
      <textarea
        class="textarea textarea-bordered w-full"
        placeholder="Enter your search query... (e.g., 'How do I configure the database?')"
        bind:value={query}
        onkeydown={handleKeyDown}
        rows="2"
      ></textarea>
    </div>

    <!-- Search Options -->
    <div class="grid grid-cols-2 gap-4 mt-2">
      <div class="form-control">
        <label class="label">
          <span class="label-text text-sm">Top K Results</span>
        </label>
        <input
          type="number"
          class="input input-bordered input-sm w-full"
          min="1"
          max="20"
          bind:value={topK}
        />
      </div>
      <div class="form-control">
        <label class="label">
          <span class="label-text text-sm">Similarity Threshold</span>
        </label>
        <div class="flex items-center gap-2">
          <input
            type="range"
            class="range range-primary range-sm flex-1"
            min="0"
            max="100"
            bind:value={threshold}
            oninput={(e) => threshold = parseInt((e.target as HTMLInputElement).value) / 100}
          />
          <span class="text-sm w-12">{formatScore(threshold)}</span>
        </div>
      </div>
    </div>

    <!-- Search Button -->
    <div class="mt-4">
      <button
        class="btn btn-primary w-full"
        disabled={searching || !query.trim()}
        onclick={performSearch}
      >
        {#if searching}
          <span class="loading loading-spinner loading-sm"></span>
          Searching...
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search
        {/if}
      </button>
    </div>

    <!-- Error -->
    {#if error}
      <div class="alert alert-error mt-4">
        <span>{error}</span>
      </div>
    {/if}

    <!-- Results -->
    {#if results.length > 0}
      <div class="divider my-2"></div>
      <div class="flex items-center justify-between">
        <h3 class="font-semibold">Results ({results.length})</h3>
        {#if searchTime !== null}
          <span class="badge badge-ghost">{searchTime}ms</span>
        {/if}
      </div>

      <div class="space-y-3 mt-2 max-h-96 overflow-y-auto">
        {#each results as result, index}
          <div class="card bg-base-200 shadow-sm">
            <div class="card-body p-4">
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="badge badge-outline badge-sm">#{index + 1}</span>
                    <span class="font-medium text-sm truncate max-w-[250px]" title={result.fileName}>
                      {result.fileName}
                    </span>
                    {#if result.pageNumber}
                      <span class="badge badge-ghost badge-sm">
                        Page {result.pageNumber}
                      </span>
                    {/if}
                    {#if result.chunkIndex !== undefined}
                      <span class="badge badge-ghost badge-sm">
                        Chunk {result.chunkIndex + 1}
                      </span>
                    {/if}
                  </div>
                </div>
                <span class="badge {getScoreColor(result.score)} badge-sm shrink-0">
                  {formatScore(result.score)}
                </span>
              </div>

              {#if result.snippet}
                <div class="mt-2 text-sm text-base-content/80 bg-base-100 p-3 rounded border border-base-300">
                  <pre class="whitespace-pre-wrap font-mono text-xs overflow-x-auto">{result.snippet}</pre>
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {:else if !searching && !error && query.trim()}
      <div class="text-center py-8 text-base-content/60">
        <p>No results found. Try adjusting your query or lowering the similarity threshold.</p>
      </div>
    {/if}
  </div>
</div>
