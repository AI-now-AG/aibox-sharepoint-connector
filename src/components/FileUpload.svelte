<script lang="ts">
  import { useTranslations } from "$i18n/utils";
  const t = useTranslations();
  import { svgIcons } from "$assets/icons";

  interface Props {
    title: string;
    acceptedTypes: Record<string, string[]>;
    modal: any;
    files?: File[];
  }

  let {
    title,
    acceptedTypes,
    modal = $bindable(),
    files = $bindable([])
  }: Props = $props();

  let isDragOver = $state(false);
  let fileDragging = $state(-1);
  let fileDropping = $state(-1);
  let fileErrorMessage: string = $state("");

  let imgElements: HTMLImageElement[] = $state([]);
  let videoElements: HTMLSourceElement[] = $state([]);

  const acceptedMimeTypes = Object.values(acceptedTypes).flat().join(", ");
  const units = ["B", "kB", "MB", "GB", "TB"];

  function humanFileSize(size: number) {
    const i = Math.floor(Math.log(size) / Math.log(1024));
    const unit = units[i];
    const formatted = size / Math.pow(1024, i);
    return `${formatted.toFixed(2)} ${unit}`;
  }

  function remove(index: number) {
    files = files.slice(0, index).concat(files.slice(index + 1));
  }

  function drop(event: DragEvent) {
    event.preventDefault();
    let removed = files.splice(fileDragging, 1);
    files.splice(fileDropping, 0, ...removed);

    fileDropping = -1;
    fileDragging = -1;
  }

  function dragenter(_event: DragEvent, index: number) {
    fileDropping = index;
  }

  function dragstart(event: DragEvent, index: number) {
    fileDragging = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
    }
  }

  function loadFile(file: File) {
    return URL.createObjectURL(file);
  }

  function isFileTypeAllowed(file: File) {
    const fileType = file.type;
    return Object.values(acceptedTypes).flat().includes(fileType);
  }

  function addFiles(
    event: Event & { currentTarget: EventTarget & HTMLInputElement },
  ) {
    const eventTarget = event.target as HTMLInputElement;
    const attachedFiles = eventTarget.files || [];
    if (attachedFiles.length > 0) {
      const file = attachedFiles[attachedFiles.length - 1];
      console.log(file.size);
      console.log(file.type);
      console.log(acceptedTypes);
      const isValid = isFileValid(file.size, file.type);
      if (isValid) {
        const newFiles = Array.from(attachedFiles).filter(
          (file) =>
            isFileTypeAllowed(file) &&
            !files.some(
              (existingFile) =>
                existingFile.name === file.name &&
                existingFile.lastModified === file.lastModified,
            ),
        );
        files = [...files, ...newFiles];
      }
    }
  }

  $effect(() => {
    imgElements.forEach((imgElement, index) => {
      if (imgElement && files[index]) {
        const blobUrl = loadFile(files[index]);
        imgElement.src = blobUrl;
        imgElement.onload = () => URL.revokeObjectURL(blobUrl);
      }
    });

    videoElements.forEach((videoElement, index) => {
      if (videoElement && files[index]) {
        const blobUrl = loadFile(files[index]);
        videoElement.src = blobUrl;
        videoElement.onload = () => URL.revokeObjectURL(blobUrl);
      }
    });
  });

  function isFileTypeValid(checkType: string) {
    for (const type in acceptedTypes) {
      if (acceptedTypes[type].includes(checkType)) {
        return true;
      }
    }
    fileErrorMessage = t("transcription.file-validation.unsupported-type");
    return false;
  }

  function isFileSizeValid(size: number) {
    if (size <= 25 * 1024 * 1024) {
      fileErrorMessage = "";
      return true;
    }
    fileErrorMessage = t("transcription.file-validation.exceed-size-limit");
    return false;
  }

  function isFileValid(size: number, type: string) {
    if (isFileTypeValid(type) && isFileSizeValid(size)) {
      return true;
    }
    return false;
  }
</script>

<dialog bind:this={modal} class="modal">
  <div class="modal-box p-4 rounded-lg mx-auto max-w-6xl">
    <h3 class="text-lg font-bold pb-4">{title}</h3>
    <form method="dialog">
      <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        >✕</button
      >
    </form>
    <div class="p7 rounded w-9/12 mx-auto">
      <div
        class="relative flex flex-col p-4 border border-neutral-content rounded"
      >
        <label
          class={`py-6 relative flex flex-col text-base-content border border-dashed rounded cursor-pointer ${isDragOver ? "border-blue-500" : "border-neutral-content"} ${fileErrorMessage && "border-error bg-error"}`}
          ondragover={() => {
            isDragOver = true;
          }}
          ondragleave={() => {
            isDragOver = false;
          }}
          ondrop={() => {
            isDragOver = false;
          }}
        >
          <input
            type="file"
            accept={acceptedMimeTypes}
            class="absolute inset-0 z-50 w-full h-full p-0 m-0 outline-none opacity-0 cursor-pointer"
            multiple
            onchange={addFiles}
          />

          <div class="flex flex-col items-center">
            {@html svgIcons.upload}
            <p class="text-base font-semibold">
              {@html t("prompt-execution.upload-file.drag")}
            </p>
            <p class="text-sm text-base-content/60 mt-1">
              {t("prompt-execution.upload-file.supportted-files")}
            </p>
            <p class="text-xs text-base-content/60 mt-8">
              {t("prompt-execution.upload-file.maximum-size")}
            </p>
          </div>
        </label>
        <span class="mt-2 text-xs text-error">{fileErrorMessage}</span>

        {#if files.length > 0}
          <div
            class="grid grid-cols-2 gap-4 mt-4 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6"
          >
            {#each files as file, index (file.name)}
              <div
                class="relative flex flex-col items-center overflow-hidden text-center bg-base-100 border border-neutral-content rounded cursor-move select-none pt-36"
                ondragstart={(e) => dragstart(e, index)}
                ondragend={() => {
                  fileDragging = -1;
                }}
                draggable="true"
                data-index={index}
              >
                <button
                  class="absolute top-0 right-0 z-50 p-1 bg-neutral rounded-bl focus:outline-none"
                  type="button"
                  onclick={() => remove(index)}
                >
                  <svg
                    class="w-4 h-4 text-neutral-content"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>

                {#if file.type.includes("audio/")}
                  <svg
                    class="absolute w-12 h-12 text-neutral-content transform top-1/2 -translate-y-2/3"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
                  </svg>
                {/if}

                {#if file.type.includes("application/") || file.type === ""}
                  <svg
                    class="absolute w-12 h-12 text-neutral-content transform top-1/2 -translate-y-2/3"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                {/if}

                {#if file.type.includes("image/")}
                  <img
                    class="absolute inset-0 z-0 object-contain w-full h-full preview bg-base-100"
                    bind:this={imgElements[index]}
                  />
                {/if}

                {#if file.type.includes("video/")}
                  <video
                    class="absolute inset-0 object-cover w-full h-full pointer-events-none preview"
                  >
                    <source bind:this={videoElements[index]} type="video/mp4" />
                  </video>
                {/if}

                <div
                  class="absolute bottom-0 left-0 right-0 flex flex-col p-2 text-xs bg-base-content bg-opacity-60"
                >
                  <span class="w-full font-bold text-base-100 truncate"
                    >{file.name}</span
                  >
                  <span class="text-xs text-base-100"
                    >{humanFileSize(file.size)}</span
                  >
                </div>

                <div
                  class="absolute inset-0 z-40 transition-colors duration-300"
                  ondragenter={(e) => dragenter(e, index)}
                  ondragleave={() => {
                    fileDropping = -1;
                  }}
                  class:bg-primary={fileDropping == index &&
                    fileDragging != index}
                  class:bg-opacity-60={fileDropping == index &&
                    fileDragging != index}
                ></div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
