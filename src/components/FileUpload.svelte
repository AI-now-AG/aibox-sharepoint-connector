<script lang="ts">
  export let title: string;
  export let acceptedTypes: Record<string, string[]>;
  export let modal;
  export let files: File[] = [];

  let isDragOver = false;
  let fileDragging = -1;
  let fileDropping = -1;

  let imgElements: HTMLImageElement[] = [];
  let videoElements: HTMLSourceElement[] = [];

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
    const attachedFiles = eventTarget.files;
    if (attachedFiles) {
      const newFiles = Array.from(attachedFiles).filter(isFileTypeAllowed);
      files = [...files, ...newFiles];
    }
  }

  $: {
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
          class={`relative flex flex-col text-base-content border border-neutral-content border-dashed rounded cursor-pointer ${isDragOver && "border-primary ring-4 ring-inset"}`}
          on:dragover={() => {
            isDragOver = true;
          }}
          on:dragleave={() => {
            isDragOver = false;
          }}
          on:drop={() => {
            isDragOver = false;
          }}
        >
          <input
            type="file"
            accept={acceptedMimeTypes}
            multiple
            class="absolute inset-0 z-50 w-full h-full p-0 m-0 outline-none opacity-0 cursor-pointer"
            on:change={addFiles}
          />

          <div
            class="flex flex-col items-center justify-center py-10 text-center"
          >
            <svg
              class="w-6 h-6 mr-1 text-current-50"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p class="m-0">Drag your files here or click in this area.</p>
          </div>
        </label>

        {#if files.length > 0}
          <div
            class="grid grid-cols-2 gap-4 mt-4 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8"
            on:drop={drop}
            on:dragover={(e) => {
              if (e.dataTransfer) {
                e.dataTransfer.dropEffect = "move";
              }
            }}
          >
            {#each files as file, index (file.name)}
              <div
                class="relative flex flex-col items-center overflow-hidden text-center bg-base-100 border border-neutral-content rounded cursor-move select-none image-box pt-36"
                on:dragstart={(e) => dragstart(e, index)}
                on:dragend={() => {
                  fileDragging = -1;
                }}
                draggable="true"
                data-index={index}
              >
                <button
                  class="absolute top-0 right-0 z-50 p-1 bg-neutral rounded-bl focus:outline-none"
                  type="button"
                  on:click={() => remove(index)}
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
                    class="absolute inset-0 z-0 object-cover w-full h-full preview bg-base-100"
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
                  on:dragenter={(e) => dragenter(e, index)}
                  on:dragleave={() => {
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
