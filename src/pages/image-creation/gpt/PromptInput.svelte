<script lang="ts">
  import { fade } from "svelte/transition";
  import FileUpload from "$components/FileUpload.svelte";
  import { svgIcons } from "$assets/icons";
  import { preventDefault } from "$utils/common";
  import { useTranslations } from "$i18n/utils";

  interface Props {
    input: string;
    files?: File[];
    isProcessing?: boolean;
    stickyFooter?: boolean;
    onsend: Function;
  }

  let {
    input = $bindable(""),
    files = $bindable([]),
    isProcessing = false,
    stickyFooter = false,
    onsend,
  }: Props = $props();

  const t = useTranslations();

  let fileModal: HTMLDialogElement | undefined = $state();

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
      placeholder="Your input..."
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
      {#if !stickyFooter}
        <button
          class="btn h-auto w-auto p-1 min-h-0 hover:text-base-content/60"
          onclick={() => {
            fileModal?.showModal();
          }}
        >
          {@html svgIcons.attachment}
          {#if files.length > 0}
            <div class="badge badge-sm badge-neutral font-normal">
              {files.length}
            </div>
          {/if}
        </button>
      {/if}
    </div>
    <div class="flex self-end">
      <button
        class="btn btn-ghost btn-md disabled:bg-base-100 disabled:cursor-not-allowed"
        disabled={!input || isProcessing}
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
      title="Upload Files"
      supportedFormatsText={t("prompt-execution.upload-file.supportted-files")}
    />
  </div>
</div>

{#if stickyFooter}
  <div class="container p-3 gap-2 items-center flex justify-center">
    {@html svgIcons.warningIcon}
    <p class="text-xs text-neutral">
      {t("prompt-execution.historyRemove.info")}
    </p>
  </div>
{/if}
