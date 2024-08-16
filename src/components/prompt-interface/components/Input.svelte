<script lang="ts">
  export let promptId = "";
  export let input = "";
  let inputText = "";
  export let output = "";
  import FileUpload from "$components/FileUpload.svelte";
  import * as fs from "node:fs/promises";
  import path from "path";

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

  let inputFiles: never[] = [];
  let imageFiles: never[] = [];
  let isClickOnFile = false;
  let imageDialogId = "imageDialog";
  let fileDialogId = "fileDialog";
  let imageModel: { showModal: () => void },
    fileModel: { showModal: () => void };

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && e.ctrlKey) {
      fetchHeadline();
    }
  }

  const readFileContent = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result)
      };
      reader.readAsDataURL(file);
    });
  };

  async function fetchHeadline() {
    input = "";

    if (inputText) {
      input = inputText;
      output = "";
      try {
        const userInputFilesList: { name: any; content: unknown; type: any; }[] = [];
        await Promise.all(
          inputFiles.map(async (file: { name: any; type: any; }) => {
            const fileContent = await readFileContent(file);
            const userInputFile = {
              name: file.name,
              content: fileContent,
              type: file.type,
            };
            await userInputFilesList.push(userInputFile);
          }),
        );

        const userInputImagesList: { name: any; content: unknown; type: any; }[] = [];
        await Promise.all(
          imageFiles.map(async (image: { name: any; type: any; }) => {
            const imageContent = await readFileContent(image);
            const userInputImage = {
              name: image.name,
              content: imageContent,
              type: image.type,
            };
            await userInputImagesList.push(userInputImage);
          }),
        );

        const response = await fetch("/api/promptExecution.json", {
          method: "POST",
          body: JSON.stringify({
            article: inputText,
            promptId: promptId,
            files: userInputFilesList,
            images: userInputImagesList,
          }),
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const reader = response.body?.getReader();

        if (reader) {
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            console.log("Received chunk:", chunk);
            // Process the chunk (e.g., append to the DOM)

            if (chunk) {
              output += chunk;
            } else {
              output = chunk;
            }
          }
        }

        // const data = await response.json();
      } catch (error) {
        console.error("Fetch headlines error:" + error);
      }
    }
  }
</script>

<div
  class="rounded-xl bg-base-100 border border-base-content/20 focus:ring-base-200 has-[:focus]:ring-2 has-[:focus]:ring-base-primary has-[:focus]:ring-offset-2 has-[:focus]:ring-offset-base-200"
>
  <textarea
    name="input"
    id="input"
    class="textarea textarea-ghost h-32 w-full focus:outline-none focus:border-base-100 text-base"
    placeholder="Your input..."
    bind:value={inputText}
    on:keydown={onKeyDown}
  ></textarea>
  <div class="grid grid-cols-[1fr_min-content] gap-4">
    <div class="p-4 flex flex-row gap-2">
      <button
        class="btn h-auto w-auto p-1 min-h-0 model-toggle"
        disabled={!promptId}
        on:click={() => {
          isClickOnFile = false;
          imageModel.showModal();
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
        class="btn h-auto w-auto p-1 min-h-0"
        disabled={!promptId}
        on:click={() => {
          isClickOnFile = true;
          fileModel.showModal();
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
    </div>
    <button
      class="btn btn-ghost btn-md self-center disabled:bg-base-100 disabled:text-slate-500 disabled:cursor-not-allowed"
      disabled={!promptId}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="1em"
        height="1em"
        viewBox="0 0 24 24"
        class={`w-8 h-8 ${promptId ? "text-primary" : "text-base-300"}`}
        on:click|preventDefault={fetchHeadline}
      >
        <path fill="currentColor" d="M3 20v-6l8-2l-8-2V4l19 8z"></path>
      </svg>
    </button>
  </div>
  <div>
    <input
      type="checkbox"
      id={isClickOnFile ? fileDialogId : imageDialogId}
      class="modal-toggle"
    />
    <FileUpload
      id={imageDialogId}
      bind:model={imageModel}
      title="Upload Images"
      acceptedTypes={imageTypes}
      bind:files={imageFiles}
    />
    <FileUpload
      id={fileDialogId}
      bind:model={fileModel}
      title="Upload Files"
      acceptedTypes={fileTypes}
      bind:files={inputFiles}
    />
  </div>
</div>
