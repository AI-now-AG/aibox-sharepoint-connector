<script lang="ts">
  import type { CreateCategoryParams } from "$pages/api/categories.json";
  import { onMount } from "svelte";
  import { useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";
  import { svgIcons } from "$assets/icons";
  import GroupList, { type GroupItem } from "./GroupList.svelte";
  const t = useTranslations();

  /**
   * TODO: Please question the user flow of creating groups here. It will be more natural
   * to create groups on demand when creating prompts.
   */

  let title: string | undefined;
  let groups: GroupItem[] = [];

  export let categoryId: string | undefined = undefined;
  export let category: CreateCategoryParams | undefined = undefined;
  export let isEditable: boolean = false;
  let isSaving = false;

  onMount(async function () {
    if (category) {
      title = category.title;
      groups = category.groups.map((group) => ({
        id: group?._id?.toString(),
        title: group.title,
        active: group?.active,
      }));
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

        window.history.back();
        addToast({
          message: data.message || t("prompt-library.add.category.success"),
          type: "success",
        });
        // setTimeout(() => {
        //   window.location.reload();
        // }, 2000);
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
    <form class="rounded pt-6 mb-4">
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

      <div class="mt-5 mb-20">
        <GroupList bind:items={groups} />
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
