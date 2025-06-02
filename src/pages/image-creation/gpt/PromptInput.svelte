<script lang="ts">
  import FileUpload from "$components/FileUpload.svelte";
  import { svgIcons } from "$assets/icons";
  import { preventDefault } from "$utils/common";

  interface Props {
    input?: string;
    files?: File[];
    onsend: Function;
  }

  let {
    input = $bindable(""),
    files = $bindable([]),
    onsend,
  }: Props = $props();

  const fileTypes = {
    "image/*": ["image/png", "image/jpeg"],
  };

  let fileModal: HTMLDialogElement | undefined = $state();

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && e.ctrlKey) {
      onsend();
    }
  }
</script>

<div
  class={`flex flex-col rounded-xl bg-base-100 border border-base-content/20 focus:ring-base-200 has-focus:ring-2 has-focus:ring-base-primary has-focus:ring-offset-2 has-focus:ring-offset-base-200`}
>
  <div class="flex-1 relative">
    <textarea
      name="input"
      id="input"
      class={`textarea textarea-ghost h-20 w-full focus:outline-hidden focus:border-base-100 text-base`}
      placeholder="Your input..."
      bind:value={input}
      onkeydown={onKeyDown}
    ></textarea>
  </div>

  <div class="grid grid-cols-[1fr_min-content] gap-4">
    <div class="p-2 flex flex-row gap-2">
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
