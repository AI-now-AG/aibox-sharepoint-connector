<script lang="ts">
  import FileUpload from "$components/FileUpload.svelte";

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
  class="rounded-xl bg-base-100 border border-base-content/20 focus:ring-base-200 has-[:focus]:ring-2 has-[:focus]:ring-base-primary has-[:focus]:ring-offset-2 has-[:focus]:ring-offset-base-200"
>
  <div class="relative">
    <textarea
      name="input"
      id="input"
      class="textarea textarea-ghost h-32 w-full focus:outline-none focus:border-base-100 text-base"
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
    <div class="p-4 flex flex-row gap-2">
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
    </div>
    <button
      class="btn btn-ghost btn-md self-center disabled:bg-base-100 disabled:text-slate-500 disabled:cursor-not-allowed"
      disabled={!promptId}
      on:click|preventDefault={fetchHeadline}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="1em"
        height="1em"
        viewBox="0 0 24 24"
        class={`w-8 h-8 ${promptId ? "text-primary" : "text-base-300"}`}
      >
        <path fill="currentColor" d="M3 20v-6l8-2l-8-2V4l19 8z"></path>
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
