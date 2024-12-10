<script lang="ts">
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";
  import Card, { type CardItem } from "$components/Card.svelte";
  import type { Category } from "$data/models/category.model";
  import type { CategoryItem } from "$utils/CategoryItem";
  import { useTranslations } from "$i18n/utils";
  const t = useTranslations();

  export let promptsEnriched: CardItem[] = [];
  export let categoryList: CategoryItem[] = [];
  export let isEditable: boolean = false;
  let searchQuery = "";
  let filteredPrompts = promptsEnriched;
  let filteredCategories = categoryList;
  let showCategoryFilter = false;
  let numberOfFilters = 0;

  $: if (searchQuery || searchQuery === "") {
    groupItemChanged();
  }

  function groupItemChanged() {
    console.log("Asdf");
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
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        class="h-4 w-4 opacity-70"
      >
        <path
          fill-rule="evenodd"
          d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
          clip-rule="evenodd"
        ></path>
      </svg>
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
          class="menu xl:menu-horizontal bg-base-100 rounded-box max-w-5xl z-50"
          out:slide
          in:slide
        >
          {#each categoryList as category, categoryIdx}
            <li>
              <label class="flex items-center space-x-2">
                <input
                  type="checkbox"
                  class="checkbox checkbox-neutral"
                  bind:checked={category.checked}
                  on:change={() => groupItemChanged()}
                />
                <h3 class="text-md font-bold">{category.title}</h3>
              </label>
              {#each category.group as group, groupIdx}
                <label class="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-neutral"
                    bind:checked={group.checked}
                    on:change={() => groupItemChanged()}
                  />
                  <span class="font-normal">{group.title}</span>
                </label>
              {/each}
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
  <Card
    title={t("prompt-library.prompts.all")}
    bind:items={filteredPrompts}
    type="prompts"
    viewLabel={t("prompt-library.prompts.view")}
    {isEditable}
  />
</div>
