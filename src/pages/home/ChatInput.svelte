<script lang="ts">
  import { type MessageHistory, MessageRole } from "$types/MessageHistory";
  import { sharedMessageHistory } from "$components/prompt-interface/components/Stores";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  const t = useTranslations();

  interface Props {
    input?: string;
    output?: string;
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
  let imageFiles: File[] = [];
  let isClickOnFile = $state(false);

  type ModalTrigger = { showModal: () => void };
  let imageModal: ModalTrigger,
    fileModal: ModalTrigger = $state();

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && e.ctrlKey) {
      fetchHeadline();
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

  async function fetchHeadline() {
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
        /*await Promise.all(
          inputFiles.map(async (file) => {
            const userInputFile = {
              name: file.name,
              content: await readFileContent(file),
              type: file.type,
            };
            userInputFilesList.push(userInputFile);
          }),
        );

        await Promise.all(
          imageFiles.map(async (image) => {
            const imageContent = await readImageContent(image);
            const userInputImage = {
              name: image.name,
              content: imageContent,
              type: image.type,
            };
            userInputImagesList.push(userInputImage);
          }),
        );*/

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

        const response = await fetch(
          `/api/prompts/67ac68aa229a55b7ea8ab56b.json`,
          {
            method: "POST",
            body: JSON.stringify({
              article: inputText,
              promptId: "67ac68aa229a55b7ea8ab56b",
              files: userInputFilesList,
              images: userInputImagesList,
              messageHistory: $sharedMessageHistory,
            }),
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

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
  class={`flex ${$sharedMessageHistory.length > 0 ? `flex-row` : `flex-col`} rounded-xl bg-base-100 border border-base-content/20 focus:ring-base-200 has-[:focus]:ring-2 has-[:focus]:ring-base-primary has-[:focus]:ring-offset-2 has-[:focus]:ring-offset-base-200`}
>
  <div class="flex-1 relative">
    <textarea
      name="input"
      id="input"
      class={`textarea textarea-ghost h-30 w-full focus:outline-none focus:border-base-100 text-base`}
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
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        ><path
          fill="currentColor"
          d="M14.952 3c-1.037 0-1.872.835-3.542 2.505l-4.91 4.91l7.085 7.085l4.91-4.91C20.165 10.92 21 10.085 21 9.048c0-1.038-.835-1.873-2.505-3.543S15.99 3 14.952 3"
          opacity="0.5"
        /><path
          fill="currentColor"
          d="M13.585 17.5L6.5 10.415l-.995.995C3.835 13.08 3 13.915 3 14.952c0 1.038.835 1.873 2.505 3.543S8.01 21 9.048 21c1.037 0 1.872-.835 3.542-2.505z"
        /><path
          fill="currentColor"
          d="M9.033 21H9zm.03 0c.796-.006 1.476-.506 2.51-1.5H21a.75.75 0 0 1 0 1.5z"
          opacity="0.5"
        /></svg
      >
    </button>
  </div>

  <div class="grid grid-cols-[1fr_min-content] gap-4">
    <div class="p-2 flex flex-row gap-2">
      {#if $sharedMessageHistory.length == 0}
        <button
          class="btn h-auto w-auto p-1 min-h-0 hover:text-base-content/60"
          onclick={() => {
            isClickOnFile = true;
            fileModal.showModal();
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="17"
            height="18"
            viewBox="0 0 17 18"
            class="w-6 h-6"
            fill="none"
          >
            <path
              d="M10.6431 4.83333L5.15499 10.3215C4.50411 10.9724 4.50411 12.0276 5.15499 12.6785C5.80586 13.3294 6.86113 13.3294 7.51201 12.6785L12.8572 7.19036C14.1589 5.88861 14.1589 3.77806 12.8572 2.47631C11.5554 1.17456 9.44489 1.17456 8.14314 2.47631L2.79796 7.96447C0.845341 9.91709 0.845341 13.0829 2.79796 15.0355C4.75058 16.9882 7.91641 16.9882 9.86903 15.0355L15.0835 9.83333"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </svg>
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
        onclick={preventDefault(fetchHeadline)}
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
  </div>
</div>
