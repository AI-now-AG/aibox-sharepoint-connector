<script lang="ts">
    import { useTranslations } from "$i18n/utils";
    const t = useTranslations();
    import { svgIcons } from "$assets/icons";
  
    const acceptedTypes: Record<string, string[]> = {
        "text/*": ['text/csv']
    };
    export let modal;
    export let files: File[] = [];
  
    let isDragOver = false;
    let fileDragging = -1;
    let fileDropping = -1;
    let fileErrorMessage: string = "";
  
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
      <h3 class="text-lg font-bold pb-4">Upload Files</h3>
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
            class={`py-6 relative flex flex-col text-base-content border border-dashed rounded cursor-pointer ${isDragOver ? "border-blue-500" : "border-neutral-content"} ${fileErrorMessage && "border-red-500 bg-red-100"}`}
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
              class="absolute inset-0 z-50 w-full h-full p-0 m-0 outline-none opacity-0 cursor-pointer"
              multiple
              on:change={addFiles}
            />
  
            <div class="flex flex-col items-center">
              {@html svgIcons.upload}
              <p class="text-base font-semibold">
                {@html t("prompt-execution.upload-file.drag")}
              </p>
              <p class="text-sm text-gray-500 mt-1">
                {t("prompt-execution.upload-file.supportted-files")}
              </p>
              <p class="text-xs text-gray-400 mt-8">
                {t("prompt-execution.upload-file.maximum-size")}
              </p>
            </div>
          </label>
          <span class="mt-2 text-xs text-red-500">{fileErrorMessage}</span>
        </div>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
</dialog>
  