<script lang="ts">
  import { onDestroy } from "svelte";
  import { sharedMessageHistory } from "$stores/chatHistory";
  import ScrollToBottom from "$components/display/ScrollToBottom.svelte";
  import InputArea from "./Input.svelte";
  import Output from "./Output.svelte";
  import { ApiKeyProvider } from "$types/TenantFeature";
  import { tenant } from "$stores";

  interface Props {
    promptId: string;
    currentPrompt: any;
    isProcessing: boolean;
  }

  let {
    promptId = "",
    currentPrompt,
    isProcessing = $bindable(false),
  }: Props = $props();

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
    $sharedMessageHistory = [];
  });
</script>

{#if $sharedMessageHistory.length == 0}
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

<Output {output} {isProcessing} />

<div class="sticky bottom-0 bg-base-200">
  {#if $sharedMessageHistory.length > 0}
    <ScrollToBottom />

    <div class="inset-x-0 bottom-0 min-w-full form-wrapper">
      <InputArea
        {promptId}
        bind:input
        bind:output
        bind:isProcessing
        {isDisableFileInput}
      />
    </div>
  {/if}
</div>
