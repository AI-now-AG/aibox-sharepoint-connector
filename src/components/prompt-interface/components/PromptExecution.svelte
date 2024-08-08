<script>
  import ExecutionCard from "$components/prompt-interface/components/ExecutionCard.svelte";
  import InputArea from "./Input.svelte";
  import PromptResults from "./PromptResults.svelte";

  export let promptItems;
  export let preferredLocale;
  let selectedPromptId;
  let input = "";
  let output = "";
</script>

<div class="grid grid-cols-1 grid-rows-[1fr_min-content] space-y-4">
  {#if !output}
    <div class="flex flex-col space-y-4">
      <p class="text-base font-normal">
        {#if selectedPromptId}
          {promptItems.filter((e) => e._id === selectedPromptId)[0].description}
        {/if}
      </p>
      <ExecutionCard cards={promptItems} bind:selectedPromptId {preferredLocale} />
    </div>
  {/if}
  <PromptResults bind:input bind:output />
  {#if !output}
    <InputArea bind:promptId={selectedPromptId} bind:input bind:output />
  {/if}
</div>
