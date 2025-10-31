<script lang="ts">
  import { onMount } from "svelte";
  import UseCaseCards from "$components/prompt-interface/UseCaseCards.svelte";
  import StreamingChatWidget from "./StreamingChatWidget.svelte";

  interface Props {
    promptItems: any;
    isEditable?: boolean;
    groupId: string;
    folderName?: string;
    initSelectedPromptId?: string;
  }

  let {
    promptItems,
    isEditable = false,
    groupId,
    folderName,
    initSelectedPromptId = "",
  }: Props = $props();

  let initSelectedPrompt;
  if (initSelectedPromptId) {
    initSelectedPrompt = promptItems.find(
      (prompt: any) => prompt._id === initSelectedPromptId,
    );
  }
  let selectedPromptId: string = $state(initSelectedPromptId);
  let currentPrompt: any = $state(initSelectedPrompt || promptItems[0]);
  let isProcessing = $state(false);
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
        onSelectCard={(prompt: any) => {
          currentPrompt = prompt;
        }}
      />
    </div>

    <StreamingChatWidget
      promptId={selectedPromptId}
      {groupId}
      {currentPrompt}
      bind:isFetching={isProcessing}
      {folderName}
    />
  </div>
</div>
