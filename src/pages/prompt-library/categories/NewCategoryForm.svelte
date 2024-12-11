<script lang="ts">
  import type {
    CreateCategoryParams,
    GroupParam,
  } from "$pages/api/categories.json";
  import { onMount } from "svelte";
  import { useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";
  import { svgIcons } from "$assets/icons";
  const t = useTranslations();

  /**
   * TODO: Please question the user flow of creating groups here. It will be more natural
   * to create groups on demand when creating prompts.
   */

  let title: string | undefined;
  let groups: GroupParam[] = [];

  export let categoryId: string | undefined = undefined;
  export let category: CreateCategoryParams | undefined = undefined;
  export let isEditable: boolean = false;
  let isSaving = false;

  onMount(async function () {
    if (category) {
      title = category.title;
      groups = category.groups;
    }
  });

  async function save() {
    if (!title) {
      addToast({
        message: "Please enter category title",
        type: "error",
      });
    } else if (groups && groups.length > 0) {
      isSaving = true;
      const newCategory: CreateCategoryParams = {
        title,
        groups: groups.map((e) => ({ _id: e._id, title: e.title })),
        ...(categoryId && { _id: categoryId }),
      };

      try {
        const response = await fetch("/api/categories.json", {
          method: category ? "PUT" : "POST",
          body: JSON.stringify(newCategory),
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();

        groups = [];
        title = undefined;

        addToast({
          message: data.message || t("prompt-library.add.category.success"),
          type: "success",
        });
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        addToast({
          message:
            error instanceof Error
              ? error.message
              : t("prompt-library.add.category.failed"),
          type: "error",
        });
      } finally {
        isSaving = false;
      }
    } else {
      addToast({
        message: t("prompt-library.add.category.group.one"),
        type: "error",
      });
    }
  }

  function addGroup() {
    const newGroup: GroupParam = {
      title: "",
    };
    groups = [...groups, newGroup];
  }

  function removeGroup(index: number) {
    groups = groups.filter((_, i) => i !== index);
  }
</script>

<div class="container max-w-5xl p-6 mx-auto p-4">
  <div class="w-full min-w-xs pt-2 lg:pt-6">
    <div class="flex items-center pt-2 pb-6">
      <button class="mr-4" onclick="window.history.back();">
        {@html svgIcons.back}
      </button>
      <h1 class="text-4xl font-bold">
        {#if category}
          {t("prompt-library.categories.edit")}
        {:else}
          {t("prompt-library.categories.add")}
        {/if}
      </h1>
    </div>
    <form class="rounded pt-6 mb-4 space-y-6">
      <div class="grid grid-cols-1 gap-4 justify-center">
        <div>
          <p class="mb-2">{t("prompt-library.add.categories.title")}*</p>
          <input
            type="text"
            bind:value={title}
            placeholder="e.g. Headline"
            class="input input-bordered w-full min-w-xs"
          />
        </div>
      </div>

      <div>
        <div class="flex items-center mb-2 space-x-4">
          <p class="text-xl">Add a new group by clicking on</p>

          <button
            class="btn btn-active btn-neutral font-normal grow-0"
            on:click|preventDefault={addGroup}
          >
            <svg
              width="13"
              height="12"
              viewBox="0 0 13 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.5 1V6M6.5 6V11M6.5 6H11.5M6.5 6L1.5 6"
                stroke="white"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
            </svg>
            Add a group
          </button>
        </div>
        <div
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 justify-center"
        >
          {#each groups as _text, index (index)}
            <div class="flex flex-row items-center gap-4">
              <label class="input input-bordered flex items-center gap-2">
                <input
                  type="text"
                  bind:value={groups[index].title}
                  placeholder="e.g. Headline"
                  class="grow w-full min-w-xs"
                />
              </label>
              <button
                class="btn btn-sm btn-circle btn-outline"
                on:click|preventDefault={() => removeGroup(index)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          {/each}
        </div>
      </div>

      {#if isEditable}
        <div class="flex items-center justify-between">
          <button
            class={`btn btn-active btn-primary px-8 font-normal ${isSaving && "btn-disabled"}`}
            on:click|preventDefault={save}
          >
            {#if isSaving}
              <span class="loading loading-spinner"></span>
              {t("prompt-library.add.prompts.saving")}
            {:else}
              {t("prompt-library.add.category.save")}
            {/if}
          </button>
        </div>
      {/if}
    </form>
  </div>
</div>
