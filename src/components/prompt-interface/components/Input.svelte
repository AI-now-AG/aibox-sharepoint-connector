<script lang="ts">
  import FileUpload from "$components/FileUpload.svelte";
  import { MessageRole } from "$types/MessageHistory";
  import { sharedMessageHistory } from "$components/prompt-interface/components/Stores";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { preventDefault } from "$utils/common";
  const t = useTranslations();

  interface Props {
    promptId?: string;
    input?: string;
    output?: string;
    isProcessing?: boolean;
  }

  let {
    promptId = $bindable(""),
    input = $bindable(""),
    output = $bindable(""),
    isProcessing = $bindable(false),
  }: Props = $props();

  let inputText = $state("");

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

  const imageTypes = {
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
        if (reader) {
          isProcessing = false;
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            partialData += chunk;
            const formattedChunk = formatMarkdown(partialData)
              .split("\n")
              .map((line) => formatMarkdown(line))
              .join("\n");
            output = formattedChunk;
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

  function formatMarkdown(text: string) {
    text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/(\*|_)(.*?)\1/g, "<em>$2</em>");
    text = text.replace(/__(.*?)__/g, "<u>$1</u>");
    text = text.replace(/~~(.*?)~~/g, "<del>$1</del>");
    text = text.replace(/`(.*?)`/g, "<code>$1</code>");
    text = text.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
    text = text.replace(/^###### (.*)$/gm, "<h6 class='text-xs'>$1</h6>");
    text = text.replace(/^##### (.*)$/gm, "<h5 class='text-sm'>$1</h5>");
    text = text.replace(/^#### (.*)$/gm, "<h4 class='text-base'>$1</h4>");
    text = text.replace(/^### (.*)$/gm, "<h3 class='text-lg'>$1</h3>");
    text = text.replace(/^## (.*)$/gm, "<h2 class='text-xl'>$1</h2>");
    text = text.replace(/^# (.*)$/gm, "<h1 class='text-2xl'>$1</h1>");
    text = text.replace(/\n/g, "<br>");
    return text;
  }

  function stripHtmlFormatting(text: string): string {
    text = text.replace(/<\/?(strong|em|u|del|code|pre|h[1-6][^>]*)>/gi, "");
    text = text.replace(/<br>/gi, "\n");
    text = text.replace(/<[^>]+>/g, "");
    return text.trim();
  }

  function clearText() {
    inputText = "";
  }
</script>

<div
  class={`flex ${$sharedMessageHistory.length > 0 ? `flex-row` : `flex-col`} rounded-xl bg-base-100 border border-base-content/20 focus:ring-base-200 has-[:focus]:ring-2 has-[:focus]:ring-base-primary has-[:focus]:ring-offset-2 has-[:focus]:ring-offset-base-200`}
>
  <div class="flex-1 relative">
    <textarea
      name="input"
      id="input"
      class={`textarea textarea-ghost ${
        $sharedMessageHistory.length > 0 ? `h-22` : `h-32`
      } w-full focus:outline-none focus:border-base-100 text-base`}
      placeholder="Your input..."
      bind:value={inputText}
      onkeydown={onKeyDown}
    ></textarea>
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <button
      type="button"
      onclick={clearText}
      class="absolute top-2 right-2 text-base-content hover:text-base-content/60"
    >
      {@html svgIcons.erase}
    </button>
  </div>

  <div class="grid grid-cols-[1fr_min-content] gap-4">
    <div class="p-2 flex flex-row gap-2">
      {#if $sharedMessageHistory.length == 0}
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
        disabled={!promptId || (!inputText && inputFiles.length === 0)}
        onclick={preventDefault(fetchHeadline)}
        aria-label="Fetch"
      >
        {#if promptId && (inputText || inputFiles.length > 0)}
          {@html svgIcons.sendActive}
        {:else}
          {@html svgIcons.sendInActive}
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
