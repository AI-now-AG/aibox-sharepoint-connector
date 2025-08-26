<script lang="ts">
  import { fade } from "svelte/transition";
  import FileUpload from "$components/FileUpload.svelte";
  import DataLossWarning from "$components/chat-ui/DataLossWarning.svelte";
  import { svgIcons } from "$assets/icons";
  import { preventDefault } from "$utils/common";
  import { useTranslations } from "$i18n/utils";
  import SelectToolOption from "./SelectToolOption.svelte";
  import type { Option } from "$components/form/Dropdown.svelte";
  import { PromptToolOption } from "$types/AIProvider";

  interface Props {
    input: string;
    files?: File[];
    isFetching?: boolean;
    stickyFooter?: boolean;
    showAttachmentButton?: boolean;
    onsend: Function;
    toolOptions?: Array<Option>;
    selectedPromptTool?: PromptToolOption;
  }

  let {
    input = $bindable(""),
    files = $bindable([]),
    isFetching = false,
    stickyFooter = false,
    showAttachmentButton = true,
    onsend,
    toolOptions,
    selectedPromptTool = $bindable(PromptToolOption.None),
  }: Props = $props();

  const t = useTranslations();

  let fileModal: HTMLDialogElement | undefined = $state();
  const acceptedTypes = {
    "audio/*": ["audio/mp3"],
    "video/*": ["video/mp4", "video/quicktime"],
    "application/*": ["application/pdf", "application/json"],
    "text/*": [
      "text/plain",
      "application/x-subrip",
      "text/tab-separated-values",
    ],
    "image/*": ["image/png", "image/jpeg"],
  };

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && e.ctrlKey) {
      onsend();
    }
  }

  function clearText() {
    input = "";
  }
</script>

<div
  class={`flex flex-col rounded-xl bg-base-100 border border-base-content/20 focus:ring-base-200 has-focus:ring-2 has-focus:ring-base-primary has-focus:ring-offset-2 has-focus:ring-offset-base-200`}
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
      {#if showAttachmentButton}
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
          classes="min-w-auto"
          placeholderClasses="h-8"
          bind:value={selectedPromptTool}
        />
      {/if}
    </div>
    <div class="flex self-end">
      <button
        class="btn btn-ghost btn-md disabled:bg-base-100 disabled:cursor-not-allowed"
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
  <div>
    <input type="checkbox" class="modal-toggle" />
    <FileUpload
      bind:files
      bind:modal={fileModal}
      title={t("upload-file.popup.title")}
      {acceptedTypes}
      supportedFormatsText={"PDF, JSON, TXT, PNG, JPEG"}
    />
  </div>
</div>

{#if stickyFooter}
  <DataLossWarning />
{/if}
