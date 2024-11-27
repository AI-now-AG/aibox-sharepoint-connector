<script lang="ts">
  import FileUpload from "$components/FileUpload.svelte";
  import { type MessageHistory, MessageRole } from "$utils/MessageHistory";
  import { sharedMessageHistory } from "$components/prompt-interface/components/Stores";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  const t = useTranslations();

  export let promptId = "";
  export let input = "";
  export let output = "";

  let inputText = "";

  const fileTypes = {
    "audio/*": ["audio/mp3"],
    "video/*": ["video/mp4", "video/quicktime"],
    "application/*": ["application/pdf", "application/json"],
    "text/*": [
      "text/plain",
      "application/x-subrip",
      "text/tab-separated-values",
    ],
  };

  const imageTypes = {
    "image/*": ["image/svg+xml", "image/png", "image/jpeg"],
  };

  let inputFiles: File[] = [];
  let imageFiles: File[] = [];
  let isClickOnFile = false;

  type ModalTrigger = { showModal: () => void };
  let imageModal: ModalTrigger, fileModal: ModalTrigger;

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && e.ctrlKey) {
      fetchHeadline();
    }
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

    if (inputText) {
      input = inputText;
      output = "";

      type FileInput = {
        name: string;
        content: unknown;
        type: string;
      };

      try {
        const userInputFilesList: FileInput[] = [];
        await Promise.all(
          inputFiles.map(async (file) => {
            const userInputFile = {
              name: file.name,
              content: await readFileContent(file),
              type: file.type,
            };
            userInputFilesList.push(userInputFile);
          }),
        );

        const userInputImagesList: FileInput[] = [];
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
        );

        const response = await fetch(`/api/prompts/${promptId}.json`, {
          method: "POST",
          body: JSON.stringify({
            article: inputText,
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
        if (reader) {
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
          const newUserMessage = {
            role: MessageRole.User,
            content: inputText,
          };
          sharedMessageHistory.update((messages) => [
            ...messages,
            newUserMessage,
          ]);

          const newAssistantMessage = {
            role: MessageRole.Assistant,
            content: output,
          };
          sharedMessageHistory.update((messages) => [
            ...messages,
            newAssistantMessage,
          ]);
          clearText();
        }
      } catch (error) {
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
      class="textarea textarea-ghost ${$sharedMessageHistory.length > 0 ? `h-22` : `h-32`} w-full focus:outline-none focus:border-base-100 text-base"
      placeholder="Your input..."
      bind:value={inputText}
      on:keydown={onKeyDown}
    ></textarea>
    <button
      type="button"
      on:click={clearText}
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
          class="btn h-auto w-auto p-1 min-h-0 model-toggle hover:text-base-content/60"
          disabled={!promptId}
          on:click={() => {
            isClickOnFile = false;
            imageModal.showModal();
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            class="w-6 h-6"
          >
            <path
              fill="currentColor"
              d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21zm0-2h14V5H5zm1-2h12l-3.75-5l-3 4L9 13zm-1 2V5zm3.5-9q.625 0 1.063-.437T10 8.5t-.437-1.062T8.5 7t-1.062.438T7 8.5t.438 1.063T8.5 10"
            ></path>
          </svg>
          {#if imageFiles.length > 0}
            <div class="badge badge-sm badge-neutral font-normal">
              {imageFiles.length}
            </div>
          {/if}
        </button>
        <button
          class="btn h-auto w-auto p-1 min-h-0 hover:text-base-content/60"
          disabled={!promptId}
          on:click={() => {
            isClickOnFile = true;
            fileModal.showModal();
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            class="w-6 h-6"
          >
            <path
              fill="currentColor"
              d="M18.5 2h-13C3.6 2 2 3.6 2 5.5v13C2 20.4 3.6 22 5.5 22H16l6-6V5.5C22 3.6 20.4 2 18.5 2m1.6 13h-1.5c-1.9 0-3.5 1.6-3.5 3.5V20H5.8c-1 0-1.8-.8-1.8-1.8V5.8C4 4.8 4.8 4 5.8 4h12.5c1 0 1.8.8 1.8 1.8zM7 7h10v2H7zm0 4h10v2H7zm0 4h6v2H7z"
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
    <button
      class="btn btn-ghost btn-md self-end disabled:bg-base-100 disabled:text-slate-500 disabled:cursor-not-allowed"
      disabled={!promptId}
      on:click|preventDefault={fetchHeadline}
    >
      <svg
        width="1em"
        height="1em"
        viewBox="0 0 20 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class={`w-8 h-8 ${promptId ? "text-primary" : "text-base-300"}`}
      >
        <path
          d="M1.40571 17.9141L19.4057 9.91413C19.5826 9.83562 19.7329 9.70747 19.8384 9.54524C19.9439 9.383 20 9.19365 20 9.00013C20 8.80662 19.9439 8.61726 19.8384 8.45502C19.7329 8.29279 19.5826 8.16464 19.4057 8.08613L1.40571 0.0861302C1.23443 0.0100342 1.04521 -0.016394 0.859632 0.00985962C0.674055 0.0361133 0.499592 0.113992 0.356138 0.234613C0.212685 0.355235 0.106018 0.513744 0.0483017 0.692062C-0.00941467 0.87038 -0.0158539 1.06133 0.0297146 1.24313L1.71871 8.00013L10.9997 8.00013C11.2649 8.00013 11.5193 8.10549 11.7068 8.29302C11.8944 8.48056 11.9997 8.73491 11.9997 9.00013C11.9997 9.26535 11.8944 9.5197 11.7068 9.70724C11.5193 9.89477 11.2649 10.0001 10.9997 10.0001L1.71871 10.0001L0.0297146 16.7581C-0.0156136 16.9399 -0.00899315 17.1307 0.0488262 17.3088C0.106646 17.487 0.213335 17.6453 0.356745 17.7658C0.500154 17.8863 0.674517 17.9641 0.859972 17.9903C1.04543 18.0165 1.23452 17.9901 1.40571 17.9141Z"
          fill="currentColor"
        />
      </svg>
    </button>
  </div>
  <div>
    <input type="checkbox" class="modal-toggle" />
    <FileUpload
      bind:modal={imageModal}
      title="Upload Images"
      acceptedTypes={imageTypes}
      bind:files={imageFiles}
    />
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
