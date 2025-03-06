<script lang="ts">
  import FileUpload from "$components/FileUpload.svelte";
  import { MessageRole } from "$types/MessageHistory";
  import { sharedMessageHistory } from "$components/prompt-interface/components/Stores";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import {
    formatMarkdown,
    parseChunkCitations,
    preventDefault,
    formatCitations,
    stripHtmlFormatting,
  } from "$utils/common";

  const t = useTranslations();

  interface Props {
    promptId?: string;
    input?: string;
    output?: string;
    isProcessing?: boolean;
    isDisableFileInput?: boolean;
    inputText?: string;
  }

  let {
    promptId = $bindable(""),
    input = $bindable(""),
    output = $bindable(""),
    isProcessing = $bindable(false),
    isDisableFileInput = false,
    inputText: initText = "",
  }: Props = $props();

  let inputText = $state("");

  $effect(() => {
    inputText = initText;
  });

  const fileTypes = {
    "audio/*": ["audio/mp3"],
    "video/*": ["video/mp4", "video/quicktime"],
    "application/*": ["application/pdf", "application/json"],
    "text/*": [
      "text/plain",
      "application/x-subrip",
      "text/tab-separated-values",
    ],
    "image/*": ["image/svg+xml", "image/png", "image/jpeg"],
  };

  let inputFiles: File[] = $state([]);
  let isClickOnFile = $state(false);

  type ModalTrigger = { showModal: () => void };
  let fileModal: ModalTrigger | undefined = $state();

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && e.ctrlKey) {
      fetchHeadline();
    }
  }

  const readFileContent = (file: File) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(file);
    });
  };

  async function fetchHeadline() {
    input = "";

    if (inputText || inputFiles.length > 0) {
      input = inputText;
      clearText();
      output = "";
      isProcessing = true;
      type FileInput = {
        name: string;
        content: unknown;
        type: string;
      };

      try {
        const userInputFilesList: FileInput[] = [];
        const userInputImagesList: FileInput[] = [];

        await Promise.all(
          inputFiles.map(async (file) => {
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

        const response = await fetch(`/api/prompts/${promptId}.json`, {
          method: "POST",
          body: JSON.stringify({
            article: input,
            promptId: promptId,
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
        }
        isProcessing = false;
      } catch (error) {
        isProcessing = false;
        console.error("Fetch headlines error:" + error);
      }
    }
  }

  function clearText() {
    inputText = "";
  }
</script>

<div
  class={`flex flex-col rounded-xl bg-base-100 border border-base-content/20 focus:ring-base-200 has-[:focus]:ring-2 has-[:focus]:ring-base-primary has-[:focus]:ring-offset-2 has-[:focus]:ring-offset-base-200`}
>
  <div class="flex-1 relative">
    <textarea
      name="input"
      id="input"
      class={`textarea textarea-ghost ${
        $sharedMessageHistory.length > 0 ? `h-[70px]` : `h-24`
      } w-full focus:outline-none focus:border-base-100 text-base`}
      placeholder={t("prompt-library.input-placeholder")}
      bind:value={inputText}
      onkeydown={onKeyDown}
    ></textarea>
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <button
      type="button"
      onclick={clearText}
      class="absolute top-2 right-2 text-base-content hover:text-base-content/60"
    >
      {@html svgIcons.eraser}
    </button>
  </div>

  <div class="grid grid-cols-[1fr_min-content] gap-4">
    <div class="p-2 flex flex-row gap-2">
      {#if $sharedMessageHistory.length == 0 && !isDisableFileInput}
        <button
          class="btn h-auto w-auto p-1 min-h-0 hover:text-base-content/60"
          disabled={!promptId}
          onclick={() => {
            isClickOnFile = true;
            fileModal?.showModal();
          }}
        >
          {@html svgIcons.attachment}

          {#if inputFiles.length > 0}
            <div class="badge badge-sm badge-neutral font-normal">
              {inputFiles.length}
            </div>
          {/if}
        </button>
      {/if}
    </div>
    <div class="flex self-end">
      <button
        class="btn btn-ghost btn-md disabled:bg-base-100 disabled:text-slate-500 disabled:cursor-not-allowed"
        disabled={!promptId ||
          (!inputText && inputFiles.length === 0) ||
          isProcessing}
        onclick={preventDefault(() => {
          fetchHeadline();
        })}
        aria-label="Fetch"
        >{#if !isProcessing}
          <span
            class={`${
              promptId && (inputText || inputFiles.length > 0)
                ? "text-primary"
                : "text-base-300"
            }`}>{@html svgIcons.paperPlane}</span
          >
        {:else}
          <span class={`text-base-300`}>{@html svgIcons.paperPlane}</span>
        {/if}
      </button>
    </div>
  </div>

  <div>
    <input type="checkbox" class="modal-toggle" />
    <FileUpload
      bind:modal={fileModal}
      title="Upload Files"
      acceptedTypes={fileTypes}
      bind:files={inputFiles}
    />
  </div>
</div>

{#if $sharedMessageHistory.length > 0}
  <div class="container p-3 gap-2 items-center flex justify-center">
    {@html svgIcons.warningIcon}
    <p class="text-xs text-neutral">
      {t("prompt-execution.historyRemove.info")}
    </p>
  </div>
{/if}
