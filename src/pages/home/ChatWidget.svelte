<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { slide } from "svelte/transition";
  import { MessageRole } from "$types/MessageHistory";
  import { sharedMessageHistory } from "$components/prompt-interface/components/Stores";
  import ChatInput from "./ChatInput.svelte";
  import ChatResults from "./ChatResults.svelte";
  import { svgIcons } from "$assets/icons";
  import { ApiKeyProvider } from "$types/TenantFeature";
  import {
    formatMarkdown,
    parseChunkCitations,
    formatCitations,
    stripHtmlFormatting,
  } from "$utils/common";
  import ModelInput from "$pages/prompt-library/prompts/ModelInput.svelte";
  import type { Option } from "$components/SelectOptions.svelte";

  let selectedModel: string = $state("openai");

  interface Props {
    tenant?: any;
  }

  let { tenant }: Props = $props();
  let input = $state("");
  let output = $state("");
  let files: File[] = $state([]);
  let isProcessing = $state(false);
  let showButton = $state(false);

  const apiProvider = tenant.api_key_providers?.find((item: any) => {
    return item.default && item.active;
  });
  let isDisableFileInput = $state(
    apiProvider?.name == ApiKeyProvider.Perplexity,
  );

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
  });

  const scrollToBottom = async () => {
    window.scroll({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  onDestroy(function () {
    sharedMessageHistory.set([]);
  });

  const readFileContent = (file: File) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(file);
    });
  };

  async function fetchMessage() {
    type FileInput = {
      name: string;
      content: unknown;
      type: string;
    };

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
        <div class="flex items-end justify-end mt-2 z-10">
          <div class="">
            <ModelInput label="Text Model" bind:selectedModel />
          </div>
        </div>
      </div>
    {/if}

    <ChatResults bind:output bind:isProcessing />

    {#if $sharedMessageHistory.length > 0}
      <div
        class="sticky bottom-0 bg-base-200"
        transition:slide={{ duration: 500 }}
      >
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
