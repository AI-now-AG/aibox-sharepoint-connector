<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import UseCaseCards from "$components/prompt-interface/UseCaseCards.svelte";
  import ChatExecutionWidget from "./ChatExecutionWidget.svelte";
  import StreamingChatWidget from "./StreamingChatWidget.svelte";
  import { PromptModel } from "$types/PromptModel";

  interface Props {
    promptItems: any;
    isEditable?: boolean;
    groupId: string;
    folderName?: string;
  }

  let { promptItems, isEditable = false, groupId, folderName }: Props = $props();

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
    // $sharedMessageHistory = [];
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
          // $sharedMessageHistory = [];
        }}
      />
    </div>

    {#if [PromptModel.OpenAIWithTools, PromptModel.OpenAIWithImageTools, PromptModel.Claude, PromptModel.Perplexity].includes(currentPrompt?.model)}
      <StreamingChatWidget
        promptId={selectedPromptId}
        {groupId}
        {currentPrompt}
        bind:isFetching={isProcessing}
        {folderName}
      />
    {:else}
      <ChatExecutionWidget
        promptId={selectedPromptId}
        {groupId}
        {currentPrompt}
        bind:isProcessing
      />
    {/if}
  </div>
</div>
