<script lang="ts" context="module">
  export interface ListItem {
    id: string;
    title: string;
    description?: string;
    instruction: string;
    tags?: string[];
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
  import Loading from "$components/Loading.svelte";
  import { loading } from "$stores";

  export let items: ListItem[] = [];
  export let title: string = "";
  export let isEditable: boolean = false;

  let categoryToDelete: string;
  let confirmDeleteModal: HTMLDialogElement;
  const flipDurationMs = 200;
  const t = useTranslations();

  function handleSort(e) {
    items = e.detail.items;
    console.log("finalize items", { items });
  }

  async function handleDelete(categoryId) {
    categoryToDelete = categoryId;
    confirmDeleteModal.show();
  }

  async function updateStatus(id: string, active: boolean) {
    $loading = true;
    const result =
      active == true
        ? await actions.category.activate({
            _id: id,
          })
        : await actions.category.deactivate({
            _id: id,
          });
    items = items.map((item) => {
      if (item.id == id) {
        item.active = active;
      }
      return item;
    });
    $loading = false;
  }

  async function deleteCategory() {
    try {
      const response = await fetch(`/api/categories.json`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ _id: categoryToDelete }),
      });

      if (response.ok) {
        items = items.filter((item) => item.id !== categoryToDelete);
        addToast({
          message: t(`prompt-library.delete.categories.success`),
          type: "success",
        });
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      console.log(error);
      addToast({
        message: t(`prompt-library.delete.categories.failed`),
        type: "error",
      });
    }
  }
</script>

<div class="container max-w-5xl mx-auto p-6 space-y-4">
  <h1 class="text-lg font-normal text-base-content/80">
    {title}
  </h1>

  <!-- drag and drop list -->
  <div class="relative">
    <div class="flex items-center bg-base-300 py-3 px-4 rounded-lg">
      <div class="flex-none w-64 text-left font-normal text-xs rounded-l-lg">
        Name
      </div>
      <div class="flex-1 w-auto text-left font-normal text-xs">&nbsp;</div>
      <div class="flex-none w-20 text-left font-normal text-xs">Status</div>
      <div class="flex-none w-20 rounded-r-lg"></div>
    </div>

    <section
      use:dndzone={{ items, flipDurationMs }}
      on:consider={handleSort}
      on:finalize={handleSort}
    >
      {#each items as item (item.id)}
        <div
          class="flex items-center h-16 bg-base-100 hover:bg-base-300 text-sm rounded-lg py-3 px-4 mt-3 dnd-item"
        >
          <div class="flex-none w-64 flex text-sm font-medium rounded-l-lg">
            <span class="inline-flex mr-3">
              {@html svgIcons.drag}
            </span>
            <a
              href={`categories/${item.id}`}
              class="underline underline-offset-2">{item.title}</a
            >
          </div>
          <div
            class="flex-1 w-auto text-gray-600 flex items-center text-xs font-normal h-16"
          >
            {#if item.tags}
              <div class="card-actions justify-start">
                {#each item.tags as tag}
                  <div class="badge px-2 border-base-300">
                    {tag}
                  </div>
                {/each}
              </div>
            {/if}
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
                  <a
                    class="flex block w-full text-left px-4 py-1 text-sm hover:underline"
                    href="categories/{item.id}"
                  >
                    {@html svgIcons.edit}
                    <span class="ml-1">Edit</span>
                  </a>
                </li>
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

    <Loading partial={true} bind:show={$loading} />
  </div>

  <!-- confirm delete dialog -->
  <ConfirmDeleteDialog
    bind:modal={confirmDeleteModal}
    on:confirm={deleteCategory}
  />
</div>
