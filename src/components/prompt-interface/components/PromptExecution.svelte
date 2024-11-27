<script>
  import { onDestroy } from "svelte";
  import { slide, fade } from "svelte/transition";
  import ExecutionCard from "$components/prompt-interface/components/ExecutionCard.svelte";
  import { sharedMessageHistory } from "$components/prompt-interface/components/Stores";
  import InputArea from "./Input.svelte";
  import PromptResults from "./PromptResults.svelte";

  export let promptItems;
  export let isEditable = false;

  let selectedPromptId;
  let input = "";
  let output = "";
  let isProcessing = false;
  let isFixed = false;

  $: if (input && !isFixed) {
    setTimeout(() => {
      isFixed = true;
    }, 500);
  }

  onDestroy(function () {
    sharedMessageHistory.set([]);
  });
</script>

<div class="grid grid-cols-1 grid-rows-[1fr_min-content] space-y-6 h-full">
  <div class="flex flex-col space-y-6">
    <p class="text-base font-normal">
      {#if selectedPromptId}
        {promptItems.filter((e) => e._id === selectedPromptId)[0].description}
      {/if}
    </p>
    <ExecutionCard cards={promptItems} bind:selectedPromptId bind:isEditable />
    {#if $sharedMessageHistory.length == 0}
      <div
        class="min-w-full form-wrapper"
        in:slide={{ duration: 500, delay: 500 }}
        out:slide={{ duration: 500 }}
      >
        <InputArea bind:promptId={selectedPromptId} bind:input bind:output bind:isProcessing />
      </div>
    {/if}
    <PromptResults bind:input bind:output bind:isProcessing />
  </div>
  <!-- <InputArea bind:promptId={selectedPromptId} bind:input bind:output /> -->

  <!-- {#if sharedMessageHistory.length > 0} -->
  <!-- <div class="relative">
    <div
      transition:fade={{ duration: 300 }}
      class="absolute inset-x-0 bottom-4"
    >
      <InputArea bind:promptId={selectedPromptId} bind:input bind:output />
    </div>
  </div> -->

  <div class="h-full" transition:slide={{ duration: 500 }}>
    {#if $sharedMessageHistory.length > 0}
      
        <div
          class="inset-x-0 bottom-0 min-w-full form-wrapper"
          out:slide={{ duration: 500 }}
          in:slide={{ duration: 500, delay: 500 }}
        >
          <InputArea bind:promptId={selectedPromptId} bind:input bind:output bind:isProcessing />
        </div>
      
    {/if}
  </div>
</div>
