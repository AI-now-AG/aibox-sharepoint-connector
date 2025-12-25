<script lang="ts">
  import { svgIcons } from "$assets/icons";

  interface SourceAttribution {
    fileName: string;
    score: number;
    pageNumber?: number;
    snippet: string;
    chunkIndex?: number;
  }

  interface Props {
    sources: SourceAttribution[];
    collapsed?: boolean;
  }

  let { sources, collapsed = true }: Props = $props();

  let isExpanded = $state(!collapsed);

  function formatScore(score: number): string {
    return (score * 100).toFixed(1) + "%";
  }

  function getScoreColor(score: number): string {
    if (score >= 0.9) return "badge-success";
    if (score >= 0.8) return "badge-info";
    if (score >= 0.7) return "badge-warning";
    return "badge-ghost";
  }

  function truncateSnippet(text: string, maxLength: number = 200): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  }
</script>

{#if sources && sources.length > 0}
  <div class="mt-4 border border-base-300 rounded-lg overflow-hidden">
    <button
      class="w-full flex items-center justify-between p-3 bg-base-200 hover:bg-base-300 transition-colors"
      onclick={() => (isExpanded = !isExpanded)}
    >
      <div class="flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 text-info"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span class="font-medium text-sm">Sources ({sources.length})</span>
      </div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4 transition-transform"
        class:rotate-180={isExpanded}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>

    {#if isExpanded}
      <div class="p-3 space-y-3 bg-base-100">
        {#each sources as source, index}
          <div class="card bg-base-200 shadow-sm">
            <div class="card-body p-3">
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-medium text-sm truncate max-w-[200px]" title={source.fileName}>
                      {source.fileName}
                    </span>
                    {#if source.pageNumber}
                      <span class="badge badge-outline badge-sm">
                        Page {source.pageNumber}
                      </span>
                    {/if}
                    {#if source.chunkIndex !== undefined}
                      <span class="badge badge-ghost badge-sm">
                        Chunk {source.chunkIndex + 1}
                      </span>
                    {/if}
                  </div>
                </div>
                <span class="badge {getScoreColor(source.score)} badge-sm shrink-0">
                  {formatScore(source.score)} match
                </span>
              </div>

              {#if source.snippet}
                <div class="mt-2 text-xs text-base-content/70 bg-base-100 p-2 rounded border border-base-300">
                  <p class="italic">"{truncateSnippet(source.snippet)}"</p>
                </div>
              {/if}
            </div>
          </div>
        {/each}

        <p class="text-xs text-base-content/50 text-center pt-2">
          These sources were used to provide context for this response
        </p>
      </div>
    {/if}
  </div>
{/if}
