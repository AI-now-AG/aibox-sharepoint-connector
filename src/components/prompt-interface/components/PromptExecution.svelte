<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { slide } from "svelte/transition";
  import ExecutionCard from "$components/prompt-interface/components/ExecutionCard.svelte";
  import { sharedMessageHistory } from "$components/prompt-interface/components/Stores";
  import InputArea from "./Input.svelte";
  import PromptResults from "./PromptResults.svelte";
  import { svgIcons } from "$assets/icons";
  import { ApiKeyProvider } from "$types/TenantFeature";

  interface Props {
    promptItems: any;
    isEditable?: boolean;
    tenant?: any;
  }

  let { promptItems, isEditable = $bindable(false), tenant }: Props = $props();

  let selectedPromptId = $state("");
  let selectPromptPredefinedInput = $state("");
  let input = $state("");
  let output = $state("");
  let isProcessing = $state(false);
  let showButton = $state(false);

  const apiProvider = tenant.api_key_providers?.find((item: any) => {
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
    const handleScroll = () => {
      const { scrollHeight, scrollTop, clientHeight } =
        document.documentElement;

      if (Math.abs(scrollHeight - clientHeight - scrollTop) > 100) {
        if (!showButton) showButton = true;
      } else {
        if (showButton) showButton = false;
      }
    };
    window.addEventListener("scroll", handleScroll);
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
      sharedMessageHistory.set([]);
      const currentPrompt = promptItems.find(
        (e: { _id: string }) => e._id === selectedPromptId,
      );
      selectPromptPredefinedInput = currentPrompt.predefined_input ?? "";
      const promptModel = currentPrompt.model ?? apiProvider.name;
      isDisableFileInput = promptModel == ApiKeyProvider.Perplexity;
    }
  });

  onDestroy(function () {
    sharedMessageHistory.set([]);
  });
</script>

<div>
  {#if selectedPromptId}
    <p class="mb-2">
      {promptItems.filter((e: { _id: string }) => e._id === selectedPromptId)[0]
        .description}
    </p>
  {/if}
  <div class="mb-6 mt-6">
    <ExecutionCard
      cards={promptItems}
      bind:selectedPromptId
      bind:isEditable
      bind:isDisabling={isProcessing}
      onSelectCard={() => {
        sharedMessageHistory.set([]);
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
  <PromptResults bind:output bind:isProcessing />

  <div class="sticky bottom-0 bg-base-200" transition:slide={{ duration: 500 }}>
    {#if $sharedMessageHistory.length > 0}
      {#if showButton}
        <div class="relative w-full flex justify-center">
          <button
            class="absolute shadow-lg hover:shadow-2xl self-center bottom-2 btn btn-sm btn-circle"
            onclick={() => {
              scrollToBottom();
            }}
          >
            {@html svgIcons.downIcon}
          </button>
        </div>
      {/if}
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
