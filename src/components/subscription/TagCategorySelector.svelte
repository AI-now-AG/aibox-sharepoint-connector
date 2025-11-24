<script lang="ts">
  import { fade, fly } from "svelte/transition";
  import type { TagItem, CategoryItem } from "$types/Subscription";

  interface Props {
    tags: TagItem[];
    categories: CategoryItem[];
    selectedTag: string;
    selectedCategories: string[];
  }

  let {
    tags = [],
    categories = [],
    selectedTag = $bindable(""),
    selectedCategories = $bindable([]),
  }: Props = $props();

  // categories for selected tag
  const filteredCategories = $derived(
    !selectedTag
      ? []
      : categories.filter((cat) => cat.tags?.includes(selectedTag)),
  );

  // Select single tag
  function selectTag(tagId: string) {
    // Unselect tag → clear categories
    if (selectedTag === tagId) {
      selectedTag = "";
      selectedCategories = [];
      return;
    }

    // Select this tag
    selectedTag = tagId;

    // Auto-select categories belonging to this tag
    const autoCategories = categories
      .filter((cat) => cat.tags?.includes(tagId))
      .map((cat) => cat.value);

    selectedCategories = autoCategories;
  }

  // Toggle category checkbox
  function toggleCategory(id: string) {
    if (selectedCategories.includes(id)) {
      selectedCategories = selectedCategories.filter((x) => x !== id);
    } else {
      selectedCategories = [...selectedCategories, id];
    }
  }
</script>

<!-- TAGS -->
<div class="mb-6 w-full">
  <div class="flex flex-wrap justify-start w-full gap-3">
    {#each tags as tag}
      <button
        class={`px-6 py-3 rounded-2xl text-sm font-semibold transition border shadow-md
            ${
              selectedTag === tag.value
                ? "bg-primary text-white border-transparent scale-[1.03]"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            }
          `}
        onclick={() => selectTag(tag.value)}
      >
        {tag.title}
      </button>
    {/each}
  </div>
</div>

<!-- CATEGORIES (checkbox version) -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-10 text-black">
  {#each filteredCategories as category}
    <label
      class={`cursor-pointer flex items-center justify-between w-full h-[64px] px-4 rounded-xl shadow-md ${
        selectedCategories.includes(category.value)
          ? "bg-[#A1E1F8]"
          : "bg-white"
      }`}
      in:fade
      out:fly
    >
      <span class="text-base font-medium">{category.title}</span>

      <input
        type="checkbox"
        class="checkbox checkbox-primary"
        checked={selectedCategories.includes(category.value)}
        onchange={() => toggleCategory(category.value)}
      />
    </label>
  {/each}
</div>
