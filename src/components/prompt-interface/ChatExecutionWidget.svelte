<script lang="ts">
  import { onDestroy } from "svelte";
  import {
    messageHistories,
    getMessageHistory,
    clearMessageHistory,
  } from "$components/prompt-interface/components/stores/messageHistoryStore";
  import ScrollToBottom from "$components/display/ScrollToBottom.svelte";
  import InputArea from "./Input.svelte";
  import Output from "./Output.svelte";
  import { ApiKeyProvider } from "$types/TenantFeature";
  import { tenant } from "$stores";
  import { useTranslations } from "$i18n/utils";

  const t = useTranslations();
  interface Props {
    promptId: string;
    groupId: string;
    currentPrompt: any;
    isProcessing: boolean;
  }

  let {
    promptId = "",
    groupId = "",
    currentPrompt,
    isProcessing = $bindable(false),
  }: Props = $props();

  let currentMessageHistory = $derived(
    $messageHistories[promptId] || getMessageHistory(promptId),
  );
  let predefinedInput = $state("");
  let input = $state("");
  let output = $state("");

  const apiProvider = $tenant?.api_key_providers?.find((item: any) => {
    return item.default && item.active;
  });
  let isDisableFileInput = $state(
    apiProvider?.name == ApiKeyProvider.Perplexity,
  );

  $inspect(currentPrompt);

  $effect(() => {
    if (currentPrompt) {
      predefinedInput = currentPrompt?.predefined_input ?? "";

      // Check and disabled file input for Perplexity
      const defaultModel = apiProvider?.name || "";
      const promptModel = currentPrompt?.model ?? defaultModel;
      isDisableFileInput = promptModel == ApiKeyProvider.Perplexity;
    }
  });

  onDestroy(function () {
    // $sharedMessageHistory = [];
  });

  function startNewChat() {
    input = "";
    output = "";
    isProcessing = false;
    clearMessageHistory(promptId);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function persistChatHistory() {
    
  }
</script>

{#if currentMessageHistory.length == 0}
  <div class="min-w-full form-wrapper">
    <InputArea
      {promptId}
      bind:input
      bind:output
      bind:isProcessing
      inputText={predefinedInput}
      {isDisableFileInput}
    />
  </div>
{/if}

<Output {promptId} {output} {isProcessing} />

<div class="sticky bottom-0 bg-base-200">
  {#if currentMessageHistory.length > 0}
    <ScrollToBottom />

    <div class="inset-x-0 bottom-0 min-w-full form-wrapper">
      <div class="my-4">
        <button
          onclick={startNewChat}
          class="btn btn-active btn-primary btn-sm px-8"
          disabled={isProcessing}
        >
          {t("home.new-chat")}
        </button>
        <button
          onclick={persistChatHistory}
          class="btn btn-active btn-primary btn-sm px-8"
          disabled={isGenerating || isFetching}
        >
          {t("prompt.save-chat")}
        </button>
      </div>
      <InputArea
        {promptId}
        {groupId}
        bind:input
        bind:output
        bind:isProcessing
        {isDisableFileInput}
      />
    </div>
  {/if}
</div>
