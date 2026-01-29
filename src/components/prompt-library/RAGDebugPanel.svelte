<script lang="ts">
  import type { RAGDebugInfo } from "$types/MessageHistory";

  interface Props {
    debug: RAGDebugInfo | null | undefined;
    collapsed?: boolean;
  }

  let { debug, collapsed = true }: Props = $props();

  let isExpanded = $state(!collapsed);

  function formatPercentage(value: number | undefined): string {
    if (value === undefined) return 'N/A';
    return `${(value * 100).toFixed(0)}%`;
  }

  function formatLatency(ms: number | undefined): string {
    if (ms === undefined) return 'N/A';
    return `${ms}ms`;
  }

  function getDecisionColor(decision?: 'answer' | 'clarify' | 'decline'): string {
    switch (decision) {
      case 'answer': return 'badge-success';
      case 'clarify': return 'badge-warning';
      case 'decline': return 'badge-error';
      default: return 'badge-ghost';
    }
  }
</script>

{#if debug}
  <div class="mt-2 border border-base-300 rounded-lg overflow-hidden bg-base-200/50">
    <button
      class="w-full flex items-center justify-between p-2 hover:bg-base-300/50 transition-colors"
      onclick={() => (isExpanded = !isExpanded)}
    >
      <div class="flex items-center gap-2 flex-wrap">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4 text-info"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <span class="font-medium text-xs">RAG Debug</span>

        <!-- Quick badges for active features -->
        {#if debug.searchMode === 'hybrid'}
          <span class="badge badge-xs badge-primary">Hybrid</span>
        {/if}
        {#if debug.wasReranked}
          <span class="badge badge-xs badge-secondary">Reranked</span>
        {/if}
        {#if debug.wasCompressed}
          <span class="badge badge-xs badge-accent">Compressed</span>
        {/if}
        {#if debug.wasMultiHop}
          <span class="badge badge-xs badge-warning">Multi-hop</span>
        {/if}
        {#if debug.wasAnswerabilityChecked}
          <span class="badge badge-xs {getDecisionColor(debug.answerabilityDecision)}">
            {debug.answerabilityDecision || 'checked'}
          </span>
        {/if}
      </div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-3 w-3 transition-transform"
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
      <div class="p-3 text-xs space-y-3 bg-base-100">
        <!-- Search Section -->
        <div class="space-y-1">
          <div class="font-semibold text-base-content/70 flex items-center gap-1">
            <span>Search</span>
            <span class="badge badge-xs">{debug.searchMode}</span>
          </div>
          <div class="grid grid-cols-2 gap-2 pl-2">
            <div>
              <span class="text-base-content/50">Threshold:</span>
              <span class="ml-1">{formatPercentage(debug.similarityThreshold)}</span>
            </div>
            <div>
              <span class="text-base-content/50">Vector Results:</span>
              <span class="ml-1">{debug.vectorResultCount}</span>
            </div>
            {#if debug.searchMode === 'hybrid'}
              <div>
                <span class="text-base-content/50">Text Results:</span>
                <span class="ml-1">{debug.textResultCount ?? 0}</span>
              </div>
              <div>
                <span class="text-base-content/50">Alpha:</span>
                <span class="ml-1">{debug.hybridAlpha?.toFixed(2) ?? 'N/A'}</span>
              </div>
            {/if}
            {#if debug.vectorTopScore !== undefined}
              <div>
                <span class="text-base-content/50">Top Vector:</span>
                <span class="ml-1">{formatPercentage(debug.vectorTopScore)}</span>
              </div>
            {/if}
            {#if debug.textTopScore !== undefined}
              <div>
                <span class="text-base-content/50">Top Text:</span>
                <span class="ml-1">{debug.textTopScore.toFixed(2)}</span>
              </div>
            {/if}
          </div>
        </div>

        <!-- Reranking Section -->
        {#if debug.wasReranked}
          <div class="space-y-1">
            <div class="font-semibold text-base-content/70">Reranking</div>
            <div class="grid grid-cols-2 gap-2 pl-2">
              <div>
                <span class="text-base-content/50">Input:</span>
                <span class="ml-1">{debug.rerankInputCount ?? 'N/A'}</span>
              </div>
              <div>
                <span class="text-base-content/50">Output:</span>
                <span class="ml-1">{debug.rerankOutputCount ?? 'N/A'}</span>
              </div>
              {#if debug.rerankLatencyMs !== undefined}
                <div class="col-span-2">
                  <span class="text-base-content/50">Latency:</span>
                  <span class="ml-1">{formatLatency(debug.rerankLatencyMs)}</span>
                </div>
              {/if}
            </div>
          </div>

          <!-- Filtered Chunks Section -->
          {#if debug.filteredChunks && debug.filteredChunks.length > 0}
            <div class="space-y-1">
              <div class="font-semibold text-base-content/70 flex items-center gap-1">
                <span>Filtered Out</span>
                <span class="badge badge-xs badge-ghost">{debug.filteredChunks.length}</span>
              </div>
              <div class="pl-2 space-y-2 max-h-64 overflow-y-auto">
                {#each debug.filteredChunks as chunk, index}
                  <div class="bg-base-200/50 rounded border border-base-300">
                    <!-- Header with file info and score -->
                    <div class="flex items-center justify-between px-2 py-1.5 border-b border-base-300/50">
                      <div class="flex items-center gap-2 min-w-0 flex-1">
                        <span class="truncate text-xs font-medium" title={chunk.fileName}>{chunk.fileName}</span>
                        {#if chunk.pageNumber}
                          <span class="badge badge-outline badge-xs shrink-0">Page {chunk.pageNumber}</span>
                        {/if}
                      </div>
                      <span class="badge badge-ghost badge-xs shrink-0 ml-2">{formatPercentage(chunk.score)}</span>
                    </div>
                    <!-- Expandable content -->
                    {#if chunk.content || chunk.snippet}
                      <details class="group">
                        <summary class="flex items-start justify-between gap-2 cursor-pointer px-2 py-1.5 hover:bg-base-300/30 transition-colors list-none [&::-webkit-details-marker]:hidden">
                          <p class="text-[10px] text-base-content/60 italic line-clamp-2 flex-1">"{chunk.snippet || chunk.content?.substring(0, 150) + '...'}"</p>
                          <svg
                            class="h-3 w-3 text-base-content/40 shrink-0 mt-0.5 transition-transform group-open:rotate-180"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </summary>
                        <div class="px-2 pb-2">
                          <pre class="text-[10px] text-base-content/70 whitespace-pre-wrap font-mono bg-base-100 p-2 rounded border border-base-300 max-h-40 overflow-y-auto">{chunk.content || chunk.snippet}</pre>
                        </div>
                      </details>
                    {:else}
                      <div class="px-2 py-1 text-[10px] text-base-content/40 italic">No content available</div>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        {/if}

        <!-- Answerability Section -->
        {#if debug.wasAnswerabilityChecked}
          <div class="space-y-1">
            <div class="font-semibold text-base-content/70">Answerability</div>
            <div class="grid grid-cols-2 gap-2 pl-2">
              <div>
                <span class="text-base-content/50">Confidence:</span>
                <span class="ml-1">{formatPercentage(debug.answerabilityConfidence)}</span>
              </div>
              <div>
                <span class="text-base-content/50">Threshold:</span>
                <span class="ml-1">{formatPercentage(debug.answerabilityThreshold)}</span>
              </div>
              {#if debug.answerabilityDecision}
                <div class="col-span-2">
                  <span class="text-base-content/50">Decision:</span>
                  <span class="badge badge-xs {getDecisionColor(debug.answerabilityDecision)} ml-1">
                    {debug.answerabilityDecision}
                  </span>
                </div>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Compression Section -->
        {#if debug.wasCompressed}
          <div class="space-y-1">
            <div class="font-semibold text-base-content/70">Compression</div>
            <div class="grid grid-cols-2 gap-2 pl-2">
              <div>
                <span class="text-base-content/50">Original:</span>
                <span class="ml-1">{debug.originalContextLength?.toLocaleString() ?? 'N/A'} chars</span>
              </div>
              <div>
                <span class="text-base-content/50">Compressed:</span>
                <span class="ml-1">{debug.compressedContextLength?.toLocaleString() ?? 'N/A'} chars</span>
              </div>
              {#if debug.compressionRatio !== undefined}
                <div class="col-span-2">
                  <span class="text-base-content/50">Ratio:</span>
                  <span class="ml-1">{formatPercentage(debug.compressionRatio)}</span>
                </div>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Multi-hop Section -->
        {#if debug.wasMultiHop}
          <div class="space-y-1">
            <div class="font-semibold text-base-content/70">Multi-hop</div>
            <div class="pl-2">
              <div>
                <span class="text-base-content/50">Hops:</span>
                <span class="ml-1">{debug.hopCount ?? 'N/A'}</span>
              </div>
              {#if debug.multiHopQueries && debug.multiHopQueries.length > 0}
                <div class="mt-1">
                  <span class="text-base-content/50">Sub-queries:</span>
                  <ul class="list-disc list-inside mt-1 text-base-content/70">
                    {#each debug.multiHopQueries as query}
                      <li class="truncate" title={query}>{query}</li>
                    {/each}
                  </ul>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
{/if}
