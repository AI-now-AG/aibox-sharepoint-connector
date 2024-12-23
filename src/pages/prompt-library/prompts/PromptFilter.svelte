<script lang="ts">
  import { slide } from "svelte/transition";
  import PromptList, {
    type CardItem,
  } from "$components/prompt-interface/PromptList.svelte";
  import type { CategoryItem } from "$utils/CategoryItem";
  import { useTranslations } from "$i18n/utils";
  import { svgIcons } from "$assets/icons";

  const t = useTranslations();

  export let promptsEnriched: CardItem[] = [];
  export let categoryList: CategoryItem[] = [];
  export let isEditable: boolean = false;

  let searchQuery = "";
  let filteredPrompts = promptsEnriched;
  let showCategoryFilter = false;
  let numberOfFilters = 0;

  $: if (searchQuery || searchQuery === "") {
    groupItemChanged();
  }

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
                  group.title.toLowerCase() == tag.toLowerCase(),
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
</script>

<div>
  <div class="container max-w-5xl mx-auto px-6">
    <label class="input input-bordered flex items-center gap-2">
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
          on:click={() => (showCategoryFilter = !showCategoryFilter)}
        >
          <svg
            width="18"
            height="17"
            viewBox="0 0 18 17"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1.5 2C1.5 1.44771 1.94772 1 2.5 1H15.5C16.0523 1 16.5 1.44772 16.5 2V3.91912C16.5 4.18434 16.3946 4.43869 16.2071 4.62623L10.9596 9.87377C10.772 10.0613 10.6667 10.3157 10.6667 10.5809V12.6667L7.33333 16V10.5809C7.33333 10.3157 7.22798 10.0613 7.04044 9.87377L1.79289 4.62623C1.60536 4.43869 1.5 4.18434 1.5 3.91912V2Z"
              stroke="#111827"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </svg>
          Filter
          {#if numberOfFilters > 0}
            <div class="badge badge-primary badge-md">{numberOfFilters}</div>
          {/if}
          <svg
            width="8"
            height="9"
            viewBox="0 0 8 9"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 3.66666L4 5.66666L2 3.66666H6Z"
              fill="#1F2937"
              stroke="#1F2937"
              stroke-width="2"
              stroke-linejoin="round"
            ></path>
          </svg>
        </button>
      </div>
      {#if showCategoryFilter}
        <ul
          class="menu menu-horizontal bg-base-100 rounded-box max-w-5xl"
          out:slide
          in:slide
        >
          {#each categoryList as category, categoryIdx}
            <li>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  class="checkbox checkbox-sm checkbox-neutral"
                  bind:checked={category.checked}
                  on:change={() => groupItemChanged()}
                />
                <h3 class="text-md font-semibold">{category.title}</h3>
              </label>
              <ul>
                <li>
                  {#each category.group as group}
                    <label class="flex items-center">
                      <input
                        type="checkbox"
                        class="checkbox checkbox-sm checkbox-neutral"
                        bind:checked={group.checked}
                        on:change={() => groupItemChanged()}
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
  <PromptList
    {isEditable}
    bind:items={filteredPrompts}
  />
</div>
