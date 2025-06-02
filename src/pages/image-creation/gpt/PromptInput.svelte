<script lang="ts">
  import UploadDialog from "./UploadDialog.svelte";
  import { svgIcons } from "$assets/icons";
  import { preventDefault } from "$utils/common";

  interface Props {
    input?: string;
    file?: File;
    onsend: Function;
  }

  let { input = $bindable(""), file = $bindable(), onsend }: Props = $props();

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
        {#if file}
          <div class="badge badge-sm badge-neutral font-normal">
            {1}
          </div>
        {/if}
      </button>
    </div>
    <div class="flex self-end">
      <button
        class="btn btn-ghost btn-md disabled:bg-base-100 disabled:cursor-not-allowed"
        disabled={!input && file}
        onclick={preventDefault(() => {
          onsend();
        })}
        aria-label="Fetch"
      >
        <span class={`${input || file ? "text-primary" : "text-base-300"}`}
          >{@html svgIcons.paperPlane}</span
        >
      </button>
    </div>
  </div>
  <div>
    <input type="checkbox" class="modal-toggle" />
    <UploadDialog bind:modal={fileModal} bind:file />
  </div>
</div>
