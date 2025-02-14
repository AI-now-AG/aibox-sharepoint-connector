<script lang="ts">
  import { fade } from "svelte/transition";
  import Output from "$components/prompt-interface/components/Output.svelte";
  import { sharedMessageHistory } from "$components/prompt-interface/components/Stores";

  interface Props {
    output: string;
    isProcessing: boolean;
  }

  let { output = $bindable(""), isProcessing = $bindable(false) }: Props =
    $props();
</script>

{#if output || $sharedMessageHistory.length > 0 || isProcessing}
  <div class="flex-1 h-full">
    <div class="flex flex-wrap h-full">
      <div class="grow md:w-1/2 p-2 pb-4 h-full">
        <div class="grid space-y-6 h-full" transition:fade>
          <Output bind:output bind:isProcessing />
        </div>
      </div>
    </div>
  </div>
{/if}
