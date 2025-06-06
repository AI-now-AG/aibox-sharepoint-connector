<script lang="ts">
  import { onDestroy } from "svelte";
  import { slide } from "svelte/transition";
  import { type FileInput } from "$types/FileUpload";
  import { MessageRole } from "$types/MessageHistory";
  import { sharedMessageHistory } from "$components/prompt-interface/components/Stores";
  import ScrollToBottom from "$components/display/ScrollToBottom.svelte";
  import ChatInput from "./ChatInput.svelte";
  import ChatResults from "./ChatResults.svelte";
  import { readFileContent } from "$utils/fileReader";
  import { ApiKeyProvider } from "$types/TenantFeature";
  import {
    formatMarkdown,
    parseChunkCitations,
    formatCitations,
    stripHtmlFormatting,
  } from "$utils/common";
  import ModelInput from "$pages/prompt-library/prompts/ModelInput.svelte";
  import { useTranslations } from "$i18n/utils";

  const t = useTranslations();
  let selectedModel: string = $state(ApiKeyProvider.OpenAI);

  interface Props {
    tenant?: any;
  }

  let { tenant }: Props = $props();
  let input = $state("");
  let output = $state("");
  let files: File[] = $state([]);
  let isProcessing = $state(false);
  let isDisableSelectModel = $state(false);

  $effect(() => {
    if ($sharedMessageHistory.length > 0 || isProcessing) {
      isDisableSelectModel = true;
    } else {
      isDisableSelectModel = false;
    }
  });

  const apiProvider = tenant.api_key_providers?.find((item: any) => {
    return item.default && item.active;
  });
  let isDisableFileInput = $state(
    apiProvider?.name == ApiKeyProvider.Perplexity,
  );

  $effect(() => {
    if (selectedModel == ApiKeyProvider.Perplexity) {
      isDisableFileInput = true;
    } else {
      isDisableFileInput = false;
    }
  });

  const scrollToTop = async () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  onDestroy(function () {
    sharedMessageHistory.set([]);
  });

  async function fetchMessage() {
    if (input || files.length > 0) {
      output = "";
      isProcessing = true;

      try {
        const userInputFilesList: FileInput[] = [];
        const userInputImagesList: FileInput[] = [];

        await Promise.all(
          files.map(async (file) => {
            const userInputFile = {
              name: file.name,
              content: await readFileContent(file),
              type: file.type,
            };
            if (file.type.startsWith("image/")) {
              userInputImagesList.push(userInputFile);
            } else {
              userInputFilesList.push(userInputFile);
            }
          }),
        );

        const response = await fetch(`/api/chat.json`, {
          method: "POST",
          body: JSON.stringify({
            article: input,
            files: userInputFilesList,
            images: userInputImagesList,
            messageHistory: $sharedMessageHistory,
            selectedModel: selectedModel ?? undefined,
          }),
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const reader = response.body?.getReader();
        let partialData = "";
        if (input) {
          const newUserMessage = {
            role: MessageRole.User,
            content: input,
            rawData: input,
          };
          sharedMessageHistory.update((messages) => [
            ...messages,
            newUserMessage,
          ]);
        }
        let citations = [];
        if (reader) {
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });

            const parsedChunk: any = parseChunkCitations(chunk);
            if (parsedChunk.citations) {
              citations = parsedChunk.citations;
            }

            partialData += parsedChunk.content ?? parsedChunk;

            const formattedChunk = formatMarkdown(partialData)
              .split("\n")
              .map((line) => formatMarkdown(line))
              .join("\n");
            output = formatCitations(formattedChunk, citations);
          }
        }
        if (output) {
          const newAssistantMessage = {
            role: MessageRole.Assistant,
            content: output,
            rawData: stripHtmlFormatting(output),
          };
          sharedMessageHistory.update((messages) => [
            ...messages,
            newAssistantMessage,
          ]);
          output = "";
          input = "";
        }
        isProcessing = false;
      } catch (error) {
        isProcessing = false;
        console.error("Fetch headlines error:" + error);
      }
    }
  }

  function startNewChat() {
    input = "";
    output = "";
    files = [];
    isProcessing = false;
    sharedMessageHistory.set([]);
    setTimeout(() => {
      scrollToTop();
    }, 0);
  }
</script>

<div class="grid grid-cols-1 grid-rows-[1fr_min-content] space-y-6 h-full">
  <div class="flex flex-col space-y-6">
    {#if $sharedMessageHistory.length == 0}
      <div
        class="min-w-full form-wrapper"
        in:slide={{ duration: 500, delay: 500 }}
        out:slide={{ duration: 500 }}
      >
        <ChatInput
          bind:input
          bind:files
          onsend={fetchMessage}
          {isDisableFileInput}
        />
      </div>
    {/if}

    <div class="flex items-end justify-end z-10">
      <div>
        <ModelInput
          label={t("prompt.text-model")}
          bind:selectedModel
          bind:disabled={isDisableSelectModel}
          labelClasses={"text-sm"}
          skipDefaultOption
        />
      </div>
    </div>

    <ChatResults bind:output bind:isProcessing />

    {#if $sharedMessageHistory.length > 0}
      <div
        class="sticky bottom-0 bg-base-200"
        transition:slide={{ duration: 500 }}
      >
        <div class="my-4">
          <button
            onclick={startNewChat}
            class="btn btn-active btn-primary btn-sm min-w-[154px]"
            disabled={isProcessing}
          >
            {t("home.new-chat")}
          </button>
        </div>
        <ScrollToBottom />
        <div
          class="min-w-full form-wrapper"
          in:slide={{ duration: 500, delay: 500 }}
          out:slide={{ duration: 500 }}
        >
          <ChatInput
            bind:input
            bind:files
            onsend={fetchMessage}
            {isDisableFileInput}
          />
        </div>
      </div>
    {/if}
  </div>
</div>
