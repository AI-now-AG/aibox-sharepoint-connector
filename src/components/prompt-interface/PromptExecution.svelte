<script lang="ts">
  import { onMount } from "svelte";
  import UseCaseCards from "$components/prompt-interface/UseCaseCards.svelte";
  import ChatExecutionWidget from "./ChatExecutionWidget.svelte";
  import StreamingChatWidget from "./StreamingChatWidget.svelte";
  import { PromptModel } from "$types/PromptModel";
  import { tenant } from "$stores";
  import { ApiKeyProvider } from "$types/TenantFeature";

  interface Props {
    promptItems: any;
    isEditable?: boolean;
    groupId: string;
    folderName?: string;
  }

  let {
    promptItems,
    isEditable = false,
    groupId,
    folderName,
  }: Props = $props();

  let selectedPromptId = $state("");
  let currentPrompt: any = $state();
  let isProcessing = $state(false);

  onMount(async function () {
    currentPrompt = promptItems[0];
  });

  function isGpt5Default() {
    const aiProviders = $tenant?.api_key_providers ?? [];
    const activeDefaultProvider = aiProviders.find(
      (item) => item.active === true && item.default === true,
    );

    if (activeDefaultProvider?.name === ApiKeyProvider.OpenAIGtp5) {
      return true;
    }
    return false;
  }
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

    {#if [PromptModel.OpenAIWithTools, PromptModel.OpenAIWithImageTools, PromptModel.Claude, PromptModel.Perplexity, PromptModel.OpenAIGpt5, PromptModel.OpenAIGpt5WithTools, PromptModel.OpenAIGpt5WithImageTools, PromptModel.Default].includes(currentPrompt?.model) || (isGpt5Default() && !currentPrompt?.model)}
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
