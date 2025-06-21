<script lang="ts">
  import { useTranslations } from "$i18n/utils";
  import { svgIcons } from "$assets/icons";

  interface Props {
    modal: any;
    file: File | undefined;
    confirm: any;
  }

  let { modal = $bindable(), file = $bindable(), confirm }: Props = $props();

  const t = useTranslations();

  const acceptedTypes: string[] = [
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  let isDragOver = $state(false);
  let fileErrorMessage: string = $state("");

  const acceptedMimeTypes = acceptedTypes.join(", ");

  function addFiles(
    event: Event & { currentTarget: EventTarget & HTMLInputElement },
  ) {
    const eventTarget = event.target as HTMLInputElement;
    file = eventTarget?.files?.[0];
    if (!file) return;
    validateFile(file);
  }

  function isFileTypeValid(type: string) {
    return acceptedTypes.includes(type);
  }

  function isFileSizeValid(size: number) {
    return size <= 5 * 1024 * 1024;
  }

  function validateFile(f: File) {
    if (!isFileTypeValid(f.type)) {
      fileErrorMessage = "unsupported-type";
      return false;
    }
    if (!isFileSizeValid(f.size)) {
      fileErrorMessage = t(
        "prompt-execution.upload-file.exceed-5mb-size-limit",
      );
      return false;
    }
    fileErrorMessage = "";
    return true;
  }

  $effect(() => {
    if (file) validateFile(file);
    else fileErrorMessage = "";
  });

  let isFormValid = $derived(file && fileErrorMessage === "");
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
        class={`py-16 relative flex flex-col text-base-content border border-dashed rounded-sm cursor-pointer ${isDragOver ? "border-info" : "border-neutral-content"} ${fileErrorMessage && "border-error/70 bg-error/30"}`}
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
          class="absolute inset-0 z-50 w-full h-full p-0 m-0 outline-hidden opacity-0 cursor-pointer"
          onchange={addFiles}
        />

        <div class="flex flex-col items-center">
          {@html svgIcons.upload}
          <p class="text-base font-semibold mt-1">
            {@html t("upload-file.popup.drag-message")}
          </p>
          {#if file}
            <p class="text-sm text-base-content/80 mt-1">{file.name}</p>
          {:else}
            <p class="text-sm text-base-content/80 mt-1">{"PDF, DOCX, TXT"}</p>
          {/if}
        </div>
      </label>
      <span class="mt-2 text-xs text-error/60">{fileErrorMessage}</span>
    </div>

    <div class="modal-action">
      <form method="dialog">
        <button class="btn btn-outline">{t("common.cancel")}</button>
        <button
          class="btn btn-primary {!isFormValid && 'btn-disabled'}"
          type="submit"
          onclick={() => {
            confirm();
          }}
        >
          {t("common.upload")}
        </button>
      </form>
    </div>
  </div>
</dialog>
