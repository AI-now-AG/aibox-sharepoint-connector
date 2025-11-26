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

  const defaultTagIconColor = "#491EFF";
  const defaultTagEmoij = "🇨🇭";

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

  function bgOpacity(color: string, opacity = 0.1) {
    return `${color}${Math.round(opacity * 255)
      .toString(16)
      .padStart(2, "0")}`;
  }
</script>

<!-- TAGS -->
<div class="w-full mb-6">
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each tags as tag}
      <button
        class={`w-full text-left p-4 rounded-xl border transition shadow-sm relative
        ${
          selectedTag === tag.value
            ? "border-[#2453FF] bg-white shadow-md"
            : "border-gray-200 bg-white hover:bg-gray-50"
        }`}
        onclick={() => selectTag(tag.value)}
      >
        <div class="flex items-center gap-3">
          <div
            class="flex w-10 h-10 flex items-center justify-center rounded-lg"
            style={`color:${tag.iconColor || defaultTagIconColor}; background:${bgOpacity(tag.iconColor || defaultTagIconColor)}`}
          >
            {#if tag.icon}
              {#if tag.icon.trim().startsWith("data:image")}
                <!-- Support icon image  -->
                <img src={tag.icon} alt="" class={`w-6 h-6`} />
              {:else}
                <!-- Support Emoij -->
                <span class="text-3xl">
                  {tag.icon}
                </span>
              {/if}
            {:else}
              <span class="text-3xl">
                {defaultTagEmoij}
              </span>
            {/if}
          </div>

          <div
            class="flex-1 font-semibold text-[15px] text-gray-900 leading-tight"
          >
            {tag.title}
          </div>
          {#if selectedTag === tag.value}
            <div
              class="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs"
            >
              ✓
            </div>
          {/if}
        </div>

        <div class="text-[13px] text-gray-500 mt-2 leading-snug pr-6">
          {tag.description}
        </div>
      </button>
    {/each}
  </div>
</div>

<!-- CATEGORIES (checkbox version) -->
<div
  class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-10 text-black mt-6"
>
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
