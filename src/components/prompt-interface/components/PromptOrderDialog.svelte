<script lang="ts">
  import Sortable from "sortablejs";
  import { useTranslations } from "$i18n/utils";
  import { svgIcons } from "$assets/icons";
  import { preventDefault } from "$utils/common";
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

  let sortable: HTMLElement | null = null;
  let localItems = [...items];

  $effect(() => {
    // Keep localItems in sync if items changes from outside
    localItems = [...items];
  });

  // Reset localItems when dialog is opened
  $effect(() => {
    if (promptOrderDialog?.open) {
      localItems = [...items];
    }
  });

  function reorder(arr: any[], evt: any) {
    const { oldIndex, newIndex } = evt;
    if (
      oldIndex === undefined ||
      newIndex === undefined ||
      oldIndex === newIndex
    )
      return arr;
    const updated = arr.slice();
    const [moved] = updated.splice(oldIndex, 1);
    updated.splice(newIndex, 0, moved);
    return updated;
  }

  $effect(() => {
    if (!sortable) return;
    const sortableInstance = Sortable.create(sortable, {
      animation: 200,
      handle: ".my-handle",
      ghostClass: "opacity-0",
      onEnd(evt) {
        localItems = reorder(localItems, evt);
      },
    });
    return () => sortableInstance.destroy();
  });

  function savePromptOrder() {
    items = [...localItems];
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

    <p class="mb-2 text-sm font-medium text-neutral">
      {t("prompt-library.prompt.prompt-order")}
    </p>

    <section>
      <ul
        class="flex w-full list-none flex-col items-center"
        bind:this={sortable}
      >
        {#each localItems as item (item.id)}
          <li
            class="flex-none w-full p-4 mb-2 flex items-center text-sm font-medium rounded-lg border cursor-pointer  my-handle cursor-move"
          >
            <span class="inline-flex mr-3">
              {@html svgIcons.drag}
            </span>
            <span class="">{item.title}</span>
          </li>
        {/each}
      </ul>
    </section>

    <div class="flex justify-end">
      <button
        class="btn btn-outline px-8 font-normal mr-2"
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
