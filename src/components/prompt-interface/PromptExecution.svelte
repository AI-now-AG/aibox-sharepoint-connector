<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import UseCaseCards from "$components/prompt-interface/UseCaseCards.svelte";
  import ExecutionWidget from "./ExecutionWidget.svelte";
  import ExecutionToolsWidget from "./ExecutionToolsWidget.svelte";
  import { sharedMessageHistory } from "$stores/chatHistory";
  import { PromptModel } from "$types/PromptModel";

  interface Props {
    promptItems: any;
    isEditable?: boolean;
  }

  let { promptItems, isEditable = false }: Props = $props();

  let selectedPromptId = $state("");
  let currentPrompt: any = $state();
  let isProcessing = $state(false);

  onMount(async function () {
    currentPrompt = promptItems[0];
  });

  $effect(() => {
    if (selectedPromptId) {
      //currentPrompt = promptItems.find((e: any) => e._id === selectedPromptId);
    }
  });

  onDestroy(function () {
    $sharedMessageHistory = [];
  });
</script>

<div class="grid grid-cols-1 grid-rows-[1fr_min-content] h-full">
  <div class="flex flex-col space-y-6">
    {#if currentPrompt}
      <p class="mb-2">
        {currentPrompt?.description ?? ""}
      </p>
    {/if}
    <div class="mb-6 mt-6">
      <UseCaseCards
        cards={promptItems}
        bind:selectedPromptId
        {isEditable}
        isDisabling={isProcessing}
        onSelectCard={(prompt) => {
          currentPrompt = prompt;
          $sharedMessageHistory = [];
        }}
      />
    </div>

    {#if currentPrompt?.model == PromptModel.OpenAIWithImageTools}
      <ExecutionToolsWidget />
    {:else}
      <ExecutionWidget
        promptId={selectedPromptId}
        {currentPrompt}
        bind:isProcessing
      />
    {/if}
  </div>
</div>
