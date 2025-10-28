<script lang="ts">
  import { fade } from "svelte/transition";
  import FileUpload from "$components/FileUpload.svelte";
  import DataLossWarning from "$components/chat-ui/DataLossWarning.svelte";
  import { svgIcons } from "$assets/icons";
  import { addToast } from "$stores/toast";
  import { preventDefault } from "$utils/common";
  import { useTranslations } from "$i18n/utils";
  import SelectToolOption from "./SelectToolOption.svelte";
  import type { Option } from "$components/form/Dropdown.svelte";
  import { dndFileUpload } from "$components/actions/DndFileUpload.svelte";
  import { PromptToolOption } from "$types/AIProvider";
  import type {
    FilesDroppedEvent,
    FilesRejectedEvent,
  } from "$types/DndFileUpload";

  interface Props {
    input: string;
    files?: File[];
    isFetching?: boolean;
    stickyFooter?: boolean;
    allowFileUpload?: boolean;
    onsend: Function;
    toolOptions?: Array<Option>;
    selectedPromptTool?: PromptToolOption;
    isDisablePromptTool?: boolean;
    showDataLossWarning?: boolean;
  }

  let {
    input = $bindable(""),
    files = $bindable([]),
    isFetching = false,
    stickyFooter = false,
    allowFileUpload = true,
    onsend,
    toolOptions,
    selectedPromptTool = $bindable(PromptToolOption.None),
    isDisablePromptTool = $bindable(false),
    showDataLossWarning = true,
  }: Props = $props();

  const t = useTranslations();

  let fileModal: HTMLDialogElement | undefined = $state();
  let isDragging: boolean = $state(false);

  const acceptedTypes = {
    "audio/*": ["audio/mp3", "audio/wav", "audio/mpeg"],
    "video/*": ["video/mp4", "video/quicktime"],
    "application/*": [
      "application/pdf",
      "application/json",
      "application/msword",
      "application/vnd.ms-excel",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/rtf",
      "application/xml",
      "application/vnd.oasis.opendocument.text",
      "application/vnd.oasis.opendocument.spreadsheet",
      "application/vnd.oasis.opendocument.presentation",
    ],
    "text/*": [
      "text/plain",
      "text/csv",
      "application/x-subrip",
      "text/tab-separated-values",
    ],
    "image/*": [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/gif",
      "image/webp",
    ],
  };

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        // allow newline
        return;
      }
      // prevent default newline
      e.preventDefault();
      onsend();
    }
  }

  function clearText() {
    input = "";
  }

  function handleFilesDropped(droppedFiles: FilesDroppedEvent) {
    console.log("Files dropped:", droppedFiles);
    const newFiles = droppedFiles.map(({ file }) => file);

    // Merge and remove duplicates by name + size
    const combined = [...files, ...newFiles];
    const unique = combined.filter(
      (file, index, self) =>
        index ===
        self.findIndex((f) => f.name === file.name && f.size === file.size),
    );

    files = unique;
  }

  function handleFilesRejected(rejectedFiles: FilesRejectedEvent) {
    console.log("Files rejected:", rejectedFiles);
    rejectedFiles.forEach(({ file, reasons }) => {
      const reason = reasons.includes("FILE_TOO_LARGE")
        ? t("prompt-execution.upload-file.exceed-5mb-size-limit")
        : reasons.includes("INVALID_MIMETYPE")
          ? t("transcription.file-validation.unsupported-type")
          : "Unknown error occurred";
      addToast({
        message: `${file.name} - ${reason}`,
        type: "error",
      });
    });
  }
</script>

<div
  class={`flex flex-col rounded-xl bg-base-100 border border-base-content/20 focus:ring-base-200 has-focus:ring-2 has-focus:ring-base-primary has-focus:ring-offset-2 has-focus:ring-offset-base-200 relative`}
  use:dndFileUpload={{
    enabled: allowFileUpload,
    acceptedTypes,
    maxSize: 5 * 1024 * 1024, // 5 MB
    onDragStart: () => {
      isDragging = true;
    },
    onDragEnd: () => {
      isDragging = false;
    },
  }}
  onfilesdropped={(e) => handleFilesDropped(e.detail)}
  onfilesrejected={(e) => handleFilesRejected(e.detail)}
>
  <div class="flex-1 relative">
    <textarea
      name="input"
      id="input"
      class={`textarea textarea-ghost ${
        stickyFooter ? `h-[50px]` : `h-20`
      } min-h-auto w-full focus:outline-hidden focus:border-base-100 text-base`}
      placeholder={t("prompt-library.input-placeholder")}
      bind:value={input}
      onkeydown={onKeyDown}
    ></textarea>
    {#if input}
      <!-- svelte-ignore a11y_consider_explicit_label -->
      <button
        type="button"
        onclick={clearText}
        class="absolute top-2 right-2 text-base-content hover:text-base-content/60"
        transition:fade={{ duration: 500 }}
      >
        {@html svgIcons.eraser}
      </button>
    {/if}
  </div>

  <div class="grid grid-cols-[1fr_min-content] gap-4">
    <div class="p-2 flex flex-row gap-2">
      {#if allowFileUpload}
        <button
          class="btn btn-outline h-8 w-auto p-1 min-h-0 border-base-content/30 aspect-square"
          onclick={() => {
            fileModal?.showModal();
          }}
          disabled={isFetching}
        >
          {@html svgIcons.attachment}
          {#if files.length > 0}
            <div class="badge badge-sm badge-neutral font-normal">
              {files.length}
            </div>
          {/if}
        </button>
      {/if}

      {#if Array.isArray(toolOptions) && toolOptions.length > 0}
        <SelectToolOption
          {toolOptions}
          classes=""
          placeholderClasses="h-8"
          dropdownBoxClasses="min-w-48"
          bind:value={selectedPromptTool}
          disabled={isDisablePromptTool}
        />
      {/if}
    </div>
    <div class="flex self-end">
      <button
        class="btn btn-ghost btn-sm mx-1 my-1 disabled:bg-base-100 disabled:cursor-not-allowed"
        disabled={(!input && files.length == 0) || isFetching}
        onclick={preventDefault(onsend)}
        aria-label="Send"
      >
        <span
          class={`${
            input || files.length > 0 ? "text-primary" : "text-base-300"
          }`}>{@html svgIcons.paperPlane}</span
        >
      </button>
    </div>
  </div>

  {#if isDragging}
    <div
      class="absolute inset-0 bg-base-200/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10 pointer-events-none rounded-xl"
    >
      <div class="text-md font-medium text-primary animate-pulse">
        {t("prompt-execution.upload-file.drop-files-here")}
      </div>
    </div>
  {/if}
</div>

<FileUpload
  bind:files
  bind:modal={fileModal}
  title={t("upload-file.popup.title")}
  {acceptedTypes}
  supportedFormatsText={t(
    "prompt-execution.upload-file.supportted-files-input",
  )}
/>

{#if stickyFooter && showDataLossWarning}
  <DataLossWarning />
{:else}
  <div class="container p-3 gap-2 items-center flex justify-center"></div>
{/if}
