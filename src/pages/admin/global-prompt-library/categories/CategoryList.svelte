<script lang="ts">
  import { actions } from "astro:actions";
  import { dndzone } from "svelte-dnd-action";
  import { addToast } from "$stores/toast";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import ConfirmDialog from "$components/ConfirmDialog.svelte";
  import Loading from "$components/Loading.svelte";
  import type { ViewCategory } from "$actions/category";
  import { preventDefault } from "$utils/common";

  interface Props {
    items?: ViewCategory[];
  }

  let { items = $bindable([]) }: Props = $props();

  let categoryToDelete: string;
  let confirmDeleteModal: HTMLDialogElement | undefined = $state();

  const flipDurationMs: number = 200;
  const dropTargetStyle: any = {
    outline: "",
  };

  let timeout: any;
  const t = useTranslations();
  let loading = $state(false);

  function reloadPage(delay = 1500) {
    setTimeout(() => {
      window.location.reload();
    }, delay);
  }

  function handleDndConsider(e: CustomEvent) {
    items = e.detail.items;
  }

  function handleDndFinalize(e: CustomEvent) {
    items = e.detail.items;

    clearTimeout(timeout);
    timeout = setTimeout(() => {
      updatePosition(items);
      reloadPage();
    }, 300);
  }

  async function handleDelete(categoryId: string) {
    categoryToDelete = categoryId;
    confirmDeleteModal?.showModal();
  }

  async function updateStatus(id: string, active: boolean) {
    loading = true;

    let result: any;
    if (active == true) {
      result = await actions.globalCategory.activate({
        _id: id,
      });
    } else {
      result = await actions.globalCategory.deactivate({
        _id: id,
      });
    }

    loading = false;
    reloadPage(1000);
  }

  async function updatePosition(items: ViewCategory[]) {
    loading = true;
    const sortedIds = items.map((item) => {
      return {
        _id: item.id,
      };
    });
    const { data } = await actions.globalCategory.updatePosition(sortedIds);
    console.log("updated items:", { sortedIds, data });
    items = data?.items ?? items;
    loading = false;
  }

  async function deleteCategory() {
    try {
      const response = await fetch(`/api/admin/global-categories.json`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ _id: categoryToDelete }),
      });

      if (response.ok) {
        addToast({
          message: t(`prompt-library.delete.categories.success`),
          type: "success",
        });

        reloadPage();
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
    {t("prompt-library.categories.all")} ({items.length})
  </h1>

  <!-- drag and drop list -->
  <div class="relative">
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
      onconsider={handleDndConsider}
      onfinalize={handleDndFinalize}
    >
      {#each items as item (item.id)}
        <div
          class="flex items-center h-16 bg-base-100 hover:bg-base-300 text-sm rounded-lg py-3 px-4 mt-3 space-x-3 dnd-item"
        >
          <div
            class="flex-1 w-48 md:w-auto flex items-center text-sm space-x-2 font-medium rounded-l-lg"
          >
            <span class="inline-flex w-10">
              {@html svgIcons.drag}
            </span>
            <a
              href={`categories/${item.id}`}
              class="flex-1 underline underline-offset-2">{item.title}</a
            >
          </div>
          <div class="flex-none w-20">
            <span
              class={item.active === true
                ? "text-success text-sm font-medium"
                : "text-sm font-medium text-neutral/70"}
              >{item.active === true
                ? t("settings.transcription.usecase.active")
                : t("settings.transcription.usecase.inactive")}</span
            >
          </div>
          <div
            class="flex-none w-10 text-right relative relative-dropdown rounded-r-lg"
          >
            <div class="dropdown dropdown-hover dropdown-end">
              <button tabindex="0" class="btn btn-ghost btn-sm z-50">
                <span class="pointer-events-none">
                  {@html svgIcons.threeDot}
                </span>
              </button>
              <ul
                class="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm"
              >
                <li>
                  <a
                    class="flex block w-full text-left px-4 py-2 text-sm hover:underline"
                    href="categories/{item.id}"
                  >
                    {@html svgIcons.edit}
                    <span class="ml-1">{t("common.edit")}</span>
                  </a>
                </li>
                <li>
                  <button
                    class="flex block w-full text-left px-4 py-2 text-sm hover:underline"
                    onclick={preventDefault(() =>
                      updateStatus(item.id, !item.active),
                    )}
                  >
                    {@html item.active === true
                      ? svgIcons.eyeClose
                      : svgIcons.eye}
                    <span class="ml-1"
                      >{item.active === true
                        ? t("common.deactivate")
                        : t("common.activate")}</span
                    >
                  </button>
                </li>
                <li>
                  <button
                    class="flex block w-full text-left px-4 py-2 text-sm hover:underline"
                    onclick={preventDefault(() => handleDelete(item.id))}
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

    <Loading show={loading} partial={true} />
  </div>

  <!-- confirm delete dialog -->
  <ConfirmDialog
    bind:modal={confirmDeleteModal}
    confirm={deleteCategory}
    title={t("confirmation.delete.title")}
    description={t("prompt-library.delete.category.confirm")}
  />
</div>
