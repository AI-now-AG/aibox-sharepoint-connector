<script lang="ts" context="module">
  export interface GroupItem {
    id?: string;
    title: string;
    active?: boolean;
  }
</script>

<script lang="ts">
  import { actions } from "astro:actions";
  import { dndzone } from "svelte-dnd-action";
  import { flip } from "svelte/animate";
  import { addToast } from "$stores/toast";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import ConfirmDeleteDialog from "./ConfirmDeleteDialog.svelte";

  export let items: GroupItem[] = [];

  let groupToDelete: string;
  let confirmDeleteModal: HTMLDialogElement;
  const flipDurationMs: number = 200;
  const t = useTranslations();

  function handleDndConsider(e: CustomEvent) {
    items = e.detail.items;
    console.log("group list / consider dispatched", { items });
  }

  function handleDndFinalize(e: CustomEvent) {
    items = e.detail.items;
    console.log("group list / finalize dispatched", { items });
  }

  async function handleDelete(categoryId: string) {
    groupToDelete = categoryId;
    confirmDeleteModal.show();
  }

  async function updateStatus(id: string, active: boolean) {}

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

<div class="w-100">
  <div class="mt-2 mb-3">
    <h1 class="text-lg font-normal text-base-content/80">
      Groups in this category ({items.length})
    </h1>
  </div>

  <!-- drag and drop list -->
  <div class="flex items-center bg-base-300 py-3 px-4 rounded-lg">
    <div class="flex-1 w-auto text-left font-normal text-xs rounded-l-lg">
      Name
    </div>
    <div class="flex-none w-20 text-left font-normal text-xs">Status</div>
    <div class="flex-none w-20 rounded-r-lg"></div>
  </div>

  <section
    use:dndzone={{ items, flipDurationMs }}
    on:consider={handleDndConsider}
    on:finalize={handleDndFinalize}
  >
    {#each items as item, i (item.id)}
      <div
        class="flex items-center h-16 bg-base-100 hover:bg-base-300 text-sm rounded-lg py-3 px-4 mt-3 dnd-item"
      >
        <div
          class="flex-1 w-auto flex items-center text-sm font-medium rounded-l-lg"
        >
          <span class="inline-flex mr-3">
            {@html svgIcons.drag}
          </span>
          <input
            type="text"
            bind:value={items[i].title}
            placeholder="e.g. Headline"
            class="input input-bordered w-full max-w-xs"
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
          class="flex-none w-20 text-right relative relative-dropdown rounded-r-lg"
        >
          <div class="dropdown dropdown-hover dropdown-end">
            <div tabindex="0" role="button" class="btn btn-ghost btn-sm">
              {@html svgIcons.threeDot}
            </div>
            <ul
              class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
            >
              <li>
                <button
                  class="flex block w-full text-left px-4 py-1 text-sm hover:underline"
                  on:click={() => updateStatus(item.id, !item.active)}
                >
                  {@html item.active == 1 ? svgIcons.eyeClose : svgIcons.eye}
                  <span class="ml-1"
                    >{item.active == 1 ? "deactivate" : "activate"}</span
                  >
                </button>
              </li>
              <li>
                <button
                  class="flex block w-full text-left px-4 py-1 text-sm hover:underline"
                  on:click={() => handleDelete(item.id)}
                >
                  {@html svgIcons.trash}
                  <span class="ml-1">Delete</span>
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
      Add a group
    </button>
  </div>

  <!-- confirm delete dialog -->
  <ConfirmDeleteDialog
    bind:modal={confirmDeleteModal}
    on:confirm={deleteGroup}
  />
</div>
