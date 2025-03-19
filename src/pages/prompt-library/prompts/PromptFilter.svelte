<script lang="ts">
  import { slide } from "svelte/transition";
  import PromptList, {
    type PromptCartItem,
  } from "$components/prompt-interface/PromptList.svelte";
  import type { CategoryItem } from "$types/CategoryItem";
  import { useTranslations } from "$i18n/utils";
  import { svgIcons } from "$assets/icons";

  const t = useTranslations();

  interface Props {
    promptsEnriched?: PromptCartItem[];
    categoryList?: CategoryItem[];
    isEditable?: boolean;
  }

  let {
    promptsEnriched = [],
    categoryList = [],
    isEditable = false,
  }: Props = $props();

  let searchQuery = $state("");
  let filteredPrompts = $state(promptsEnriched);
  let showCategoryFilter = $state(false);
  let numberOfFilters = $state(0);

  function groupItemChanged() {
    const checkedCategories = categoryList.filter(
      (category) => category.checked,
    );

    const checkedGroups = categoryList
      .flatMap((category) => category.group)
      .filter((group) => group?.checked);

    numberOfFilters = checkedCategories.length + checkedGroups.length;

    if (checkedCategories.length > 0 || checkedGroups.length > 0) {
      filteredPrompts = promptsEnriched.filter((prompt) => {
        return (
          prompt.tags?.some(
            (tag) =>
              checkedGroups.some(
                (group) =>
                  //group.title.toLowerCase().includes(tag.toLowerCase()),
                  group?.title.toLowerCase() == tag.toLowerCase(),
              ) ||
              checkedCategories.some(
                (cateogry) => cateogry.title.toLowerCase() == tag.toLowerCase(),
              ),
          ) &&
          (prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            prompt.instruction
              .toLowerCase()
              .includes(searchQuery.toLowerCase()))
        );
      });
    } else {
      filteredPrompts = promptsEnriched.filter((prompt) => {
        return (
          prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prompt.instruction.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }
  }
  $effect(() => {
    if (searchQuery || searchQuery === "") {
      groupItemChanged();
    }
  });
</script>

<div>
  <div class="container max-w-5xl mx-auto px-6">
    <label class="input input-bordered flex items-center gap-2 w-full">
      {@html svgIcons.search}
      <input
        type="text"
        class="grow"
        placeholder={t("prompt-library.prompts.search")}
        bind:value={searchQuery}
      />
    </label>

    <div class="flex flex-col justify-start pt-2 gap-2">
      <div>
        <button
          class="btn btn-sm btn-active font-normal bg-base-200"
          onclick={() => (showCategoryFilter = !showCategoryFilter)}
        >
          {@html svgIcons.filter}
          {t("common.filter")}
          {#if numberOfFilters > 0}
            <div class="badge badge-primary badge-md">{numberOfFilters}</div>
          {/if}
          {@html svgIcons.arrowDownFill}
        </button>
      </div>
      {#if showCategoryFilter}
        <ul
          class="menu menu-horizontal bg-base-100 rounded-box max-w-5xl"
          out:slide
          in:slide
        >
          {#each categoryList as category}
            <li>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  class="checkbox checkbox-sm checkbox-neutral"
                  bind:checked={category.checked}
                  onchange={() => groupItemChanged()}
                />
                <h3 class="text-md font-semibold">{category.title}</h3>
              </label>
              <ul>
                <li>
                  {#each category.group as any as group}
                    <label class="flex items-center">
                      <input
                        type="checkbox"
                        class="checkbox checkbox-sm checkbox-neutral"
                        bind:checked={group.checked}
                        onchange={() => groupItemChanged()}
                      />
                      <span class="font-normal">{group.title}</span>
                    </label>
                  {/each}
                </li>
              </ul>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
  <PromptList {isEditable} bind:items={filteredPrompts} />
</div>
