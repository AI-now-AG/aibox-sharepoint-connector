<script lang="ts">
  import { dndzone } from "svelte-dnd-action";
  import { useTranslations } from "$i18n/utils";
  import { svgIcons } from "$assets/icons";
  const t = useTranslations();

  interface Props {
    promptOrderDialog?: HTMLDialogElement;
    dialogTitle?: string;
    items: any[];
    confirm: any;
  }

  let {
    promptOrderDialog = $bindable(),
    dialogTitle = t("prompt-library.prompt.change-order"),
    items = $bindable(),
    confirm,
  }: Props = $props();

  const flipDurationMs = 300;
  const dropTargetStyle: any = { outline: "" };

  function preventDefault(fn) {
    return function (event) {
      event.preventDefault();
      fn.call(this, event);
    };
  }

  function handleDndConsider(e: { detail: { items: any[] } }) {
    items = e.detail.items;
  }

  function handleDndFinalize(e: { detail: { items: any[] } }) {
    items = e.detail.items;
  }

  function savePromptOrder() {
    promptOrderDialog?.close();
    confirm();
  }

  function cancelEdit() {
    promptOrderDialog?.close();
  }
</script>

<dialog bind:this={promptOrderDialog} class="modal">
  <div class="modal-box w-8/12 max-w-5xl">
    <div class="flex justify-between">
      <h3 class="text-lg font-bold py-4">{dialogTitle}</h3>
      <button class="btn btn-sm btn-circle btn-ghost" onclick={cancelEdit}>
        {@html svgIcons.closeMenu}
      </button>
    </div>

    <p class="mb-2 text-sm font-sans font-medium text-neutral-500">
      {t("prompt-library.prompt.prompt-order")}
    </p>

    <section
      use:dndzone={{ items, flipDurationMs, dropTargetStyle }}
      onconsider={handleDndConsider}
      onfinalize={handleDndFinalize}
    >
      {#each items as item (item.id)}
        <div
          class="flex-none w-full p-4 mb-2 flex items-center text-sm font-medium rounded-lg border"
        >
          <span class="inline-flex mr-3">
            {@html svgIcons.drag}
          </span>
          <span class="">{item.title}</span>
        </div>
      {/each}
    </section>

    <div class="flex justify-end">
      <button
        class="btn btn-active btn-neutral-content px-8 font-normal mr-2"
        onclick={preventDefault(cancelEdit)}
      >
        {t("common.cancel")}
      </button>
      <button
        class={`btn btn-active btn-primary px-8 font-normal`}
        onclick={preventDefault(savePromptOrder)}
      >
        {t("common.save")}
      </button>
    </div>
  </div>
</dialog>
