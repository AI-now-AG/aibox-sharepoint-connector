<script lang="ts">
  import { slide } from "svelte/transition";
  import PromptFilter from "$components/prompt-interface/PromptFilter.svelte";
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
  <PromptFilter
    items={promptsEnriched}
    {categoryList}
    onFilterCallback={(items: PromptCartItem[]) => {
      filteredPrompts = items;
    }}
  />
  <PromptList {isEditable} bind:items={filteredPrompts} />
</div>
