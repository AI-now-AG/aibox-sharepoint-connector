<script lang="ts">
  import { svgIcons } from "$assets/icons";
  import type { SourceType, SourceAttribution as SourceAttributionType } from "$types/MessageHistory";

  interface SourceAttribution {
    fileName: string;
    score: number;
    pageNumber?: number;
    sectionTitle?: string;
    documentLanguage?: string;
    snippet: string;
    content?: string;
    chunkIndex?: number;
    vectorScore?: number;
    textScore?: number;
    fusedScore?: number;
    rerankScore?: number;
    sourceType?: SourceType;
  }

  interface Props {
    sources: SourceAttribution[];
    collapsed?: boolean;
    showDebug?: boolean; // Show debug badges for sources
  }

  let { sources, collapsed = true, showDebug = false }: Props = $props();

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

  function hasExpandableContent(source: SourceAttribution): boolean {
    // If we have full content and it's longer than the snippet
    if (source.content && source.content.length > source.snippet.length) {
      return true;
    }
    return false;
  }

  function getFullContent(source: SourceAttribution): string {
    return source.content || source.snippet;
  }

  function getSourceTypeBadge(sourceType?: SourceType): { label: string; class: string } {
    switch (sourceType) {
      case 'hybrid':
        return { label: 'V+T', class: 'badge-primary' };
      case 'text':
        return { label: 'T', class: 'badge-accent' };
      case 'vector':
      default:
        return { label: 'V', class: 'badge-secondary' };
    }
  }

  function formatDebugScores(source: SourceAttribution): string {
    const parts: string[] = [];
    if (source.vectorScore !== undefined) {
      parts.push(`Vector: ${(source.vectorScore * 100).toFixed(1)}%`);
    }
    if (source.textScore !== undefined) {
      parts.push(`Text: ${source.textScore.toFixed(2)}`);
    }
    if (source.fusedScore !== undefined) {
      parts.push(`RRF: ${source.fusedScore.toFixed(4)}`);
    }
    return parts.join(' | ');
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
          class="h-5 w-5 text-primary"
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
                    {#if source.sectionTitle}
                      <span class="badge badge-info badge-outline badge-sm" title="Section: {source.sectionTitle}">
                        {source.sectionTitle}
                      </span>
                    {/if}
                    {#if source.chunkIndex !== undefined}
                      <span class="badge badge-ghost badge-sm">
                        Chunk {source.chunkIndex + 1}
                      </span>
                    {/if}
                    {#if showDebug && source.documentLanguage}
                      <span class="badge badge-ghost badge-xs" title="Detected language">
                        {source.documentLanguage}
                      </span>
                    {/if}
                    <!-- Source type badge (debug mode) -->
                    {#if showDebug && source.sourceType}
                      {@const typeBadge = getSourceTypeBadge(source.sourceType)}
                      <span
                        class="badge badge-xs {typeBadge.class}"
                        title={source.sourceType === 'hybrid' ? 'Hybrid (Vector + Text)' : source.sourceType === 'text' ? 'Text Search' : 'Vector Search'}
                      >
                        {typeBadge.label}
                      </span>
                    {/if}
                  </div>
                  <!-- Debug scores tooltip -->
                  {#if showDebug && (source.vectorScore !== undefined || source.textScore !== undefined)}
                    <div class="text-xs text-base-content/50 mt-1">
                      {formatDebugScores(source)}
                    </div>
                  {/if}
                </div>
                <span class="badge {getScoreColor(source.score)} badge-sm shrink-0">
                  {formatScore(source.score)} match
                </span>
              </div>

              {#if source.snippet}
                {#if hasExpandableContent(source)}
                  <!-- Expandable snippet with custom details/summary -->
                  <details class="mt-2 group">
                    <summary class="flex items-start justify-between gap-2 cursor-pointer bg-base-100 border border-base-300 rounded p-2 hover:bg-base-200 transition-colors list-none [&::-webkit-details-marker]:hidden">
                      <div class="flex-1 min-w-0">
                        <p class="text-xs text-base-content/70 italic line-clamp-2">"{source.snippet}"</p>
                        <span class="text-base-content/50 text-[10px] mt-1 block group-open:hidden">Click to expand</span>
                        <span class="text-base-content/50 text-[10px] mt-1 hidden group-open:block">Click to collapse</span>
                      </div>
                      <svg
                        class="h-4 w-4 text-base-content/50 shrink-0 mt-0.5 transition-transform group-open:rotate-180"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div class="mt-2 max-h-[40vh] overflow-y-auto">
                      <pre class="text-xs text-base-content/80 whitespace-pre-wrap font-mono bg-base-200 p-3 rounded border border-base-300">{getFullContent(source)}</pre>
                    </div>
                  </details>
                {:else}
                  <!-- Short snippet - no expansion needed -->
                  <div class="mt-2 text-xs text-base-content/70 bg-base-100 p-2 rounded border border-base-300">
                    <p class="italic">"{source.snippet}"</p>
                  </div>
                {/if}
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
