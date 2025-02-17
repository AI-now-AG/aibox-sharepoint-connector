<script lang="ts">
  import FileUpload from "$components/FileUpload.svelte";
  import { type MessageHistory, MessageRole } from "$types/MessageHistory";
  import { sharedMessageHistory } from "$components/prompt-interface/components/Stores";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  const t = useTranslations();

  interface Props {
    input?: string;
    output?: string;
    inputFiles?: string;
    isProcessing?: boolean;
  }

  let {
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
  let fileModal: HTMLDialogElement | undefined = $state();

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && e.ctrlKey) {
      fetchMessage();
    }
  }

  function preventDefault(fn) {
    return function (event) {
      event.preventDefault();
      fn.call(this, event);
    };
  }

  const readImageContent = (image: File) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(image);
    });
  };

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
    input = "";

    if (inputText || inputFiles.length > 0) {
      input = inputText;
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

        const response = await fetch(`/api/chat.json`, {
          method: "POST",
          body: JSON.stringify({
            article: inputText,
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
        if (inputText) {
          const newUserMessage = {
            role: MessageRole.User,
            content: inputText,
            rawData: inputText,
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
          clearText();
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
  class={`flex flex-col rounded-xl bg-base-100 border border-base-content/20 focus:ring-base-200 has-[:focus]:ring-2 has-[:focus]:ring-base-primary has-[:focus]:ring-offset-2 has-[:focus]:ring-offset-base-200`}
>
  <div class="flex-1 relative">
    <textarea
      name="input"
      id="input"
      class={`textarea textarea-ghost h-25 w-full focus:outline-none focus:border-base-100 text-base`}
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
      {@html svgIcons.eraser}
    </button>
  </div>

  <div class="grid grid-cols-[1fr_min-content] gap-4">
    <div class="p-2 flex flex-row gap-2">
      {#if $sharedMessageHistory.length == 0}
        <button
          class="btn h-auto w-auto p-1 min-h-0 hover:text-base-content/60"
          onclick={() => {
            fileModal.showModal();
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
        disabled={!inputText && inputFiles.length === 0}
        onclick={preventDefault(fetchMessage)}
        aria-label="Fetch"
      >
        <svg
          width="1em"
          height="1em"
          viewBox="0 0 20 18"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          class={`w-8 h-8 ${
            inputText || inputFiles.length > 0
              ? "text-primary"
              : "text-base-300"
          }`}
        >
          <path
            d="M1.40571 17.9141L19.4057 9.91413C19.5826 9.83562 19.7329 9.70747 19.8384 9.54524C19.9439 9.383 20 9.19365 20 9.00013C20 8.80662 19.9439 8.61726 19.8384 8.45502C19.7329 8.29279 19.5826 8.16464 19.4057 8.08613L1.40571 0.0861302C1.23443 0.0100342 1.04521 -0.016394 0.859632 0.00985962C0.674055 0.0361133 0.499592 0.113992 0.356138 0.234613C0.212685 0.355235 0.106018 0.513744 0.0483017 0.692062C-0.00941467 0.87038 -0.0158539 1.06133 0.0297146 1.24313L1.71871 8.00013L10.9997 8.00013C11.2649 8.00013 11.5193 8.10549 11.7068 8.29302C11.8944 8.48056 11.9997 8.73491 11.9997 9.00013C11.9997 9.26535 11.8944 9.5197 11.7068 9.70724C11.5193 9.89477 11.2649 10.0001 10.9997 10.0001L1.71871 10.0001L0.0297146 16.7581C-0.0156136 16.9399 -0.00899315 17.1307 0.0488262 17.3088C0.106646 17.487 0.213335 17.6453 0.356745 17.7658C0.500154 17.8863 0.674517 17.9641 0.859972 17.9903C1.04543 18.0165 1.23452 17.9901 1.40571 17.9141Z"
            fill="currentColor"
          />
        </svg>
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
