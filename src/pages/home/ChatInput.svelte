<script lang="ts">
  import FileUpload from "$components/FileUpload.svelte";
  import { sharedMessageHistory } from "$components/prompt-interface/components/Stores";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { preventDefault } from "$utils/common";

  const t = useTranslations();

  interface Props {
    input?: string;
    files?: File[];
    onsend: Function;
    isDisableFileInput?: boolean;
  }

  let {
    input = $bindable(""),
    files = $bindable([]),
    onsend,
    isDisableFileInput = false,
  }: Props = $props();

  const fileTypes = {
    "audio/*": ["audio/mp3"],
    "video/*": ["video/mp4", "video/quicktime"],
    "application/*": ["application/pdf", "application/json"],
    "text/*": [
      "text/plain",
      "application/x-subrip",
      "text/tab-separated-values",
    ],
    "image/*": ["image/svg+xml", "image/png", "image/jpeg"],
  };

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
  id="onboardingId2"
  class={`flex flex-col rounded-xl bg-base-100 border border-base-content/20 focus:ring-base-200 has-focus:ring-2 has-focus:ring-base-primary has-focus:ring-offset-2 has-focus:ring-offset-base-200`}
>
  <div class="flex-1 relative">
    <textarea
      name="input"
      id="input"
      class={`textarea textarea-ghost ${
        $sharedMessageHistory.length > 0 ? `h-[50px]` : `h-20`
      } min-h-auto w-full focus:outline-hidden focus:border-base-100 text-base`}
      placeholder="Your input..."
      bind:value={input}
      onkeydown={onKeyDown}
    ></textarea>
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <button
      type="button"
      onclick={clearText}
      class="absolute top-2 right-2 text-base-content hover:text-base-content/60"
    >
      {@html svgIcons.eraser}
    </button>
  </div>

  <div class="grid grid-cols-[1fr_min-content] gap-4">
    <div class="p-2 flex flex-row gap-2">
      {#if $sharedMessageHistory.length == 0 && !isDisableFileInput}
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
        disabled={!input && files.length === 0}
        onclick={preventDefault(() => {
          onsend();
        })}
        aria-label="Fetch"
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
      bind:modal={fileModal}
      title="Upload Files"
      acceptedTypes={fileTypes}
      bind:files
    />
  </div>
</div>

{#if $sharedMessageHistory.length > 0}
  <div class="container p-3 gap-2 items-center flex justify-center">
    {@html svgIcons.warningIcon}
    <p class="text-xs text-neutral">
      {t("prompt-execution.historyRemove.info")}
    </p>
  </div>
{/if}
