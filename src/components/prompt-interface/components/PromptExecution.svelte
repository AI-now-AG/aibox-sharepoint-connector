<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { slide } from "svelte/transition";
  import UseCaseCard from "$components/prompt-interface/components/UseCaseCard.svelte";
  import { sharedMessageHistory } from "$stores/chatHistory";
  import ScrollToBottom from "$components/display/ScrollToBottom.svelte";
  import InputArea from "./Input.svelte";
  import Output from "./Output.svelte";
  import { svgIcons } from "$assets/icons";
  import { ApiKeyProvider } from "$types/TenantFeature";
  import { tenant } from "$stores";

  interface Props {
    promptItems: any;
    isEditable?: boolean;
  }

  let { promptItems, isEditable = false }: Props = $props();

  let selectedPromptId = $state("");
  let selectPromptPredefinedInput = $state("");
  let input = $state("");
  let output = $state("");
  let isProcessing = $state(false);

  const apiProvider = $tenant.api_key_providers?.find((item: any) => {
    return item.default && item.active;
  });
  let isDisableFileInput = $state(
    apiProvider?.name == ApiKeyProvider.Perplexity,
  );

  // svelte-ignore non_reactive_update
  let textInputComponent: any;

  function adjustHeightByContent() {
    setTimeout(() => {
      textInputComponent?.adjustHeightByContent();
    }, 0);
  }

  onMount(() => {
    adjustHeightByContent();
  });

  const scrollToBottom = async () => {
    window.scroll({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  $effect(() => {
    if (selectedPromptId) {
      $sharedMessageHistory = [];
      const currentPrompt = promptItems.find(
        (e: { _id: string }) => e._id === selectedPromptId,
      );
      selectPromptPredefinedInput = currentPrompt.predefined_input ?? "";
      const promptModel = currentPrompt.model ?? apiProvider.name;
      isDisableFileInput = promptModel == ApiKeyProvider.Perplexity;
    }
  });

  onDestroy(function () {
    $sharedMessageHistory = [];
  });
</script>

<div class="grid grid-cols-1 grid-rows-[1fr_min-content] h-full">
  <div class="flex flex-col space-y-6">
    {#if selectedPromptId}
      <p class="mb-2">
        {promptItems.filter(
          (e: { _id: string }) => e._id === selectedPromptId,
        )[0].description}
      </p>
    {/if}
    <div class="mb-6 mt-6">
      <UseCaseCard
        cards={promptItems}
        bind:selectedPromptId
        {isEditable}
        isDisabling={isProcessing}
        onSelectCard={() => {
          $sharedMessageHistory = [];
          adjustHeightByContent();
        }}
      />
    </div>
    {#if $sharedMessageHistory.length == 0}
      <div
        class="min-w-full form-wrapper"
        in:slide={{ duration: 500, delay: 500 }}
        out:slide={{ duration: 500 }}
      >
        <InputArea
          bind:promptId={selectedPromptId}
          bind:input
          bind:output
          bind:isProcessing
          bind:this={textInputComponent}
          inputText={selectPromptPredefinedInput}
          {isDisableFileInput}
        />
      </div>
    {/if}

    <Output {output} {isProcessing} />

    <div
      class="sticky bottom-0 bg-base-200"
      transition:slide={{ duration: 500 }}
    >
      {#if $sharedMessageHistory.length > 0}
        <ScrollToBottom />

        <div
          class="inset-x-0 bottom-0 min-w-full form-wrapper"
          out:slide={{ duration: 500 }}
          in:slide={{ duration: 500, delay: 500 }}
        >
          <InputArea
            bind:promptId={selectedPromptId}
            bind:input
            bind:output
            bind:isProcessing
            {isDisableFileInput}
          />
        </div>
      {/if}
    </div>
  </div>
</div>
