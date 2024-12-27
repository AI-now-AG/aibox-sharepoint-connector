<script lang="ts">
  import { useTranslations } from "$i18n/utils";
  import { createEventDispatcher } from "svelte";
  import { svgIcons } from "$assets/icons";

  export let modal;
  export let file: File | undefined;

  const dispatch = createEventDispatcher();
  const t = useTranslations();

  const acceptedTypes: Record<string, string[]> = {
    "text/csv": ["text/csv"],
  };
  let isDragOver = false;
  let fileErrorMessage: string = "";

  const acceptedMimeTypes = Object.values(acceptedTypes).flat().join(", ");

  $: {
    if (file && !isFileValid(file)) {
      fileErrorMessage = "unsupported-type";
    } else {
      fileErrorMessage = "";
    }
  }

  $: isFormValid = file && isFileValid(file);

  function addFiles(
    event: Event & { currentTarget: EventTarget & HTMLInputElement },
  ) {
    const eventTarget = event.target as HTMLInputElement;
    file = eventTarget?.files?.[0];

    if (!file || !isFileValid(file)) {
      return;
    }
  }

  function isFileTypeValid(checkType: string) {
    for (const type in acceptedTypes) {
      if (acceptedTypes[type].includes(checkType)) {
        return true;
      }
    }
    return false;
  }

  function isFileValid(file: File) {
    const type = file.type;
    if (isFileTypeValid(type)) {
      return true;
    }
    return false;
  }
</script>

<dialog bind:this={modal} class="modal">
  <div class="modal-box px-4 py-5 rounded-lg mx-auto max-w-3xl">
    <h3 class="text-lg font-bold pb-4">{t("upload-file.popup.title")}</h3>
    <form method="dialog">
      <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        >✕</button
      >
    </form>
    <div class="relative flex flex-col py-4">
      <label
        class={`py-16 relative flex flex-col text-base-content border border-dashed rounded cursor-pointer ${isDragOver ? "border-blue-500" : "border-neutral-content"} ${fileErrorMessage && "border-red-500 bg-red-100"}`}
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
          on:change={addFiles}
        />

        <div class="flex flex-col items-center">
          {@html svgIcons.upload}
          <p class="text-base font-semibold mt-1">
            {@html t("upload-file.popup.drag-message")}
          </p>
          {#if file}
            <p class="text-sm text-gray-400 mt-1">{file.name}</p>
          {:else}
            <p class="text-sm text-gray-400 mt-1">{"CSV"}</p>
          {/if}
        </div>
      </label>
      <span class="mt-2 text-xs text-red-500">{fileErrorMessage}</span>
    </div>

    <div class="modal-action">
      <form method="dialog">
        <button class="btn">{t("common.cancel")}</button>
        <button
          class="btn btn-primary {!isFormValid && 'btn-disabled'}"
          type="submit"
          on:click={() => {
            dispatch("confirm");
          }}
        >
          {t("common.upload")}
        </button>
      </form>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
