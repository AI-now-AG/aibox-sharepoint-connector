<script lang="ts">
  import { getFileNameFromAzureUrl } from "$utils/documentExtractor";

  interface Props {
    fileUrls: string[];
  }

  let { fileUrls = [] }: Props = $props();
</script>

{#if Array.isArray(fileUrls) && fileUrls.length > 0}
  <div class="flex mt-2 space-x-4 max-w-5xl overflow-x-auto">
    {#each fileUrls as url}
      <div
        class="flex items-center p-2 border border-base-content/20 rounded-xl"
      >
        <span class="text-green-600 mr-2">📎</span>
        <span class=" link-primary text-xs font-medium"
          >{getFileNameFromAzureUrl(url)}</span
        >
      </div>
    {/each}
  </div>
{/if}
