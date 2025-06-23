<script lang="ts" module>
  export interface Tool {
    name: "image" | "websearch";
    active?: boolean;
    disabled?: boolean;
  }
</script>

<script lang="ts">
  import { fade } from "svelte/transition";
  import FileUpload from "$components/FileUpload.svelte";
  import DataLossWarning from "$components/chat-ui/DataLossWarning.svelte";
  import { svgIcons } from "$assets/icons";
  import { preventDefault } from "$utils/common";
  import { useTranslations } from "$i18n/utils";

  interface Props {
    input: string;
    files?: File[];
    isFetching?: boolean;
    stickyFooter?: boolean;
    tools?: Tool[];
    onsend: Function;
  }

  let {
    input = $bindable(""),
    files = $bindable([]),
    isFetching = false,
    stickyFooter = false,
    tools = $bindable([]),
    onsend,
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

  //$inspect(tools);

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
    <div class="p-2 flex flex-row gap-3">
      <button
        class="btn h-auto w-auto p-1 min-h-0 hover:text-base-content/60"
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
      {#each tools as tool, index}
        <label class="label px-2 border border-base-300">
          <span
            class="text-xs text-gray-500"
            class:text-primary={tool.active && !tool.disabled}
          >
            {@html svgIcons.imageTool}
          </span>
          <input
            type="checkbox"
            checked={tool.active}
            disabled={tool.disabled || isFetching}
            onchange={(e: Event) => {
              const target = e.target;
              if (target instanceof HTMLInputElement) {
                tools = tools.map((t, i) =>
                  index === i ? { ...t, active: target.checked } : t,
                );
              }
            }}
            class="toggle toggle-xs checked:border-primary checked:bg-primary checked:text-primary-content disabled:text-white"
          />
        </label>
      {/each}
    </div>
    <div class="flex self-end">
      <button
        class="btn btn-ghost btn-md disabled:bg-base-100 disabled:cursor-not-allowed"
        disabled={!input || isFetching}
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

<style>
  .toggle:disabled::before {
    background-color: currentColor;
  }
</style>
