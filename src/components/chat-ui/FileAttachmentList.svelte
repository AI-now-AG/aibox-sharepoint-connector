<script lang="ts">
  import { getFileNameFromAzureUrl } from "$utils/azureFileUtils";

  interface Props {
    fileUrls: string[];
  }

  let { fileUrls = [] }: Props = $props();
</script>

{#if Array.isArray(fileUrls) && fileUrls.length > 0}
  <div class="flex flex-wrap mt-2 space-x-4 max-w-5xl">
    {#each fileUrls as url}
      <div
        class="flex items-center p-2 border border-base-content/20 rounded-xl mb-2"
      >
        <span class="text-green-600 mr-2">📎</span>
        <span class=" link-primary text-xs font-medium"
          >{getFileNameFromAzureUrl(url)}</span
        >
      </div>
    {/each}
  </div>
{/if}
