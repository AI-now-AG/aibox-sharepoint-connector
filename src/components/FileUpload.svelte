<script>
  export let id;
  export let title;
  export let acceptedTypes;
  //   export let files;
  export let model;

  export let files = [];
  let isDragOver = false;
  let fileDragging = null;
  let fileDropping = null;
  let imgElements = []; // Store references to image elements
  let videoElements = []; // Store references to video elements

  const acceptedMimeTypes = Object.values(acceptedTypes).flat().join(", ");

  function humanFileSize(size) {
    const i = Math.floor(Math.log(size) / Math.log(1024));
    return (
      (size / Math.pow(1024, i)).toFixed(2) * 1 +
      " " +
      ["B", "kB", "MB", "GB", "TB"][i]
    );
  }

  function remove(index) {
    files = files.slice(0, index).concat(files.slice(index + 1));
  }

  function drop(event) {
    event.preventDefault();
    let removed = files.splice(fileDragging, 1);
    files.splice(fileDropping, 0, ...removed);

    fileDropping = null;
    fileDragging = null;
  }

  function dragenter(event, index) {
    fileDropping = index;
  }

  function dragstart(event, index) {
    fileDragging = index;
    event.dataTransfer.effectAllowed = "move";
  }

  function loadFile(file) {
    return URL.createObjectURL(file);
  }

  function isFileTypeAllowed(file) {
    const fileType = file.type;
    return Object.values(acceptedTypes).flat().includes(fileType);
  }

  function addFiles(event) {
    const newFiles = Array.from(event.target.files).filter(isFileTypeAllowed);
    files = [...files, ...newFiles];
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

<dialog bind:this={model} class="modal">
  <div class="modal-box p-4 rounded-lg mx-auto max-w-7xl">
    <h3 class="text-lg font-bold pb-4">{title}</h3>
    <div class="p7 rounded w-9/12 mx-auto">
      <div
        class="relative flex flex-col p-4 border border-neutral-content rounded"
      >
        <div
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
        </div>

        {#if files.length > 0}
          <div
            class="grid grid-cols-2 gap-4 mt-4 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8"
            on:drop={drop}
            on:dragover={(e) => {
              e.dataTransfer.dropEffect = "move";
            }}
          >
            {#each files as file, index (file.name)}
              <div
                class="relative flex flex-col items-center overflow-hidden text-center bg-base-100 border border-neutral-content rounded cursor-move select-none image-box pt-36"
                on:dragstart={(e) => dragstart(e, index)}
                on:dragend={() => {
                  fileDragging = null;
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
                    fileDropping = null;
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
