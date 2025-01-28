<script lang="ts" context="module">
  export interface GroupItem {
    id?: string;
    title: string;
    active?: boolean;
  }
</script>

<script lang="ts">
  import { dndzone } from "svelte-dnd-action";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import ConfirmDialog from "$components/ConfirmDialog.svelte";

  export let items: GroupItem[] = [];

  let groupToDelete: string;
  let confirmDeleteModal: HTMLDialogElement;

  const flipDurationMs: number = 200;
  const dropTargetStyle: any = {
    outline: "",
  };
  const t = useTranslations();

  function handleDndConsider(e: CustomEvent) {
    items = e.detail.items;
  }

  function handleDndFinalize(e: CustomEvent) {
    items = e.detail.items;
    console.log("group list / finalize dispatched", { items });
  }

  async function handleDelete(categoryId: string) {
    groupToDelete = categoryId;
    confirmDeleteModal.show();
  }

  async function updateStatus(id: string, active: boolean) {
    items = items.map((item) => {
      if (item.id == id) {
        item.active = active;
      }
      return item;
    });
  }

  function addGroup() {
    const newGroup: GroupItem = {
      id: `new_${new Date().getTime()}`,
      title: "",
      active: true,
    };
    items = [...items, newGroup];
  }

  async function deleteGroup() {
    items = items.filter((item) => item.id !== groupToDelete);
  }
</script>

<div>
  <div class="mb-3">
    <h1 class="text-lg font-normal text-base-content/80">
      {t("prompt-library.categories.all-group")} ({items.length})
    </h1>
  </div>

  <!-- drag and drop list -->
  <div class="flex items-center bg-base-300 py-3 px-4 space-x-3 rounded-lg">
    <div
      class="flex-1 w-48 md:w-auto text-left font-normal text-xs space-x-2 rounded-l-lg"
    >
      <span class="inline-flex w-10"></span>
      {t("prompt-library.categories.list.name")}
    </div>
    <div class="flex-none w-20 text-left font-normal text-xs">
      {t("prompt-library.categories.list.status")}
    </div>
    <div class="flex-none w-10 rounded-r-lg"></div>
  </div>

  <section
    use:dndzone={{ items, flipDurationMs, dropTargetStyle }}
    on:consider={handleDndConsider}
    on:finalize={handleDndFinalize}
  >
    {#each items as item, i (item.id)}
      <div
        class="flex items-center h-16 bg-base-100 hover:bg-base-300 text-sm rounded-lg py-3 px-4 space-x-2 mt-3 dnd-item"
      >
        <div
          class="flex-1 w-48 md:w-auto flex items-center text-sm font-medium space-x-3 rounded-l-lg"
        >
          <span class="inline-flex w-10">
            {@html svgIcons.drag}
          </span>
          <input
            type="text"
            bind:value={items[i].title}
            placeholder="e.g. Headline"
            class="input input-bordered w-full max-w-md"
          />
        </div>
        <div class="flex-none w-20">
          <span
            class={item.active == 1
              ? "text-emerald-600 text-sm font-medium"
              : "text-grey-600 text-sm font-medium"}
            >{item.active == 1 ? "active" : "inactive"}</span
          >
        </div>
        <div
          class="flex-none w-10 text-right relative relative-dropdown rounded-r-lg"
        >
          <div class="dropdown dropdown-hover dropdown-end">
            <button tabindex="0" class="btn btn-ghost btn-sm">
              <span class="pointer-events-none">
                {@html svgIcons.threeDot}
              </span>
            </button>
            <ul
              class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
            >
              <li>
                <button
                  class="flex block w-full text-left px-4 py-2 text-sm hover:underline"
                  on:click|preventDefault={() =>
                    updateStatus(item.id, !item.active)}
                >
                  {@html item.active == 1 ? svgIcons.eyeClose : svgIcons.eye}
                  <span class="ml-1"
                    >{item.active == 1
                      ? t("common.deactivate")
                      : t("common.activate")}</span
                  >
                </button>
              </li>
              <li>
                <button
                  class="flex block w-full text-left px-4 py-2 text-sm hover:underline"
                  on:click|preventDefault={() => handleDelete(item.id)}
                >
                  {@html svgIcons.trash}
                  <span class="ml-1">{t("common.delete")}</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    {/each}
  </section>

  <div class="flex items-center mt-5">
    <button
      class="btn btn-active btn-neutral font-normal grow-0"
      on:click|preventDefault={addGroup}
    >
      {@html svgIcons.add}
      {t("prompt-library.categories.add-group")}
    </button>
  </div>

  <!-- confirm delete dialog -->
  <ConfirmDialog
    bind:modal={confirmDeleteModal}
    on:confirm={deleteGroup}
    title={t("confirmation.delete.title")}
    description={t("prompt-library.delete.group.confirm")}
  />
</div>
