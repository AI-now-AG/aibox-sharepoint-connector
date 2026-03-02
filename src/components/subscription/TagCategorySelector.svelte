<script lang="ts">
  import { fade, fly } from "svelte/transition";
  import type { TagItem, CategoryItem } from "$types/Subscription";
  import { bgOpacity } from "$utils/common";
  import { useTranslations } from "$i18n/utils";

  interface Props {
    defaultLanguage?: string;
    tags: TagItem[];
    categories: CategoryItem[];
    selectedTag: string;
    selectedCategories: string[];
    titleAlignCenter?: boolean;
  }

  let {
    defaultLanguage = "en",
    tags = [],
    categories = [],
    selectedTag = $bindable(""),
    selectedCategories = $bindable([]),
    titleAlignCenter = false,
  }: Props = $props();

  const t = useTranslations(defaultLanguage);

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

  function findTagById(tags: TagItem[], id: string): TagItem | undefined {
    return tags.find((tag) => tag.value === id);
  }

  function getTagNameById(id: string) {
    const tag: TagItem | undefined = findTagById(tags ?? [], id);
    return tag?.title ?? "-";
  }
</script>

<h2
  class={`font-sanns text-3xl font-bold text-black ${titleAlignCenter ? "text-center" : ""}`}
>
  {t("subscription.choose-business-branch")}
</h2>

<div
  class={`font-sans text-base font-medium text-gray-600 mt-4 mb-6 ${titleAlignCenter ? "text-center" : ""}`}
>
  {t("subscription.choose-categories")}
</div>

<!-- TAGS -->
<div class="w-full mb-6">
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each tags as tag}
      <button
        class={`w-full p-4 rounded-xl border transition shadow-sm text-left flex flex-col gap-2
        ${
          selectedTag === tag.value
            ? "border-[#2453FF] bg-white shadow-md"
            : "border-gray-200 bg-white hover:bg-gray-50"
        }`}
        onclick={() => selectTag(tag.value)}
      >
        <!-- ⭐ TOP ROW ALWAYS ALIGNED -->
        <div class="flex items-center gap-3">
          <div
            class="flex w-10 h-10 items-center justify-center rounded-lg shrink-0"
            style={`color:${tag.iconColor || defaultTagIconColor}; background:${bgOpacity(tag.iconColor || defaultTagIconColor)}`}
          >
            {#if tag.icon}
              {#if tag.icon.trim().startsWith("data:image")}
                <!-- Image icon -->
                <img src={tag.icon} alt="" class="w-6 h-6" />
              {:else}
                <!-- Emoji -->
                <span class="text-2xl">{tag.icon}</span>
              {/if}
            {:else}
              <span class="text-2xl">{defaultTagEmoij}</span>
            {/if}
          </div>

          <div class="flex-1 font-semibold text-lg text-gray-900 leading-tight">
            {tag.title}
          </div>

          {#if selectedTag === tag.value}
            <div
              class="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs shrink-0"
            >
              ✓
            </div>
          {/if}
        </div>

        <!-- DESCRIPTION -->
        {#if tag.description}
          <div class="text-sm text-gray-500 leading-[20px] pr-4">
            {tag.description}
          </div>
        {/if}
      </button>
    {/each}
  </div>
</div>

{#if selectedTag}
  <div class="font-sans text-base font-bold mt-10 mb-4">
    {t("subscription.select-sub-categories-for", {
      tagName: getTagNameById(selectedTag),
    })}
  </div>
{/if}

<!-- CATEGORIES (checkbox version) -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-10 text-black">
  {#each filteredCategories as category}
    <label
      class={`cursor-pointer flex items-center justify-between w-full h-[64px] px-4 rounded-xl shadow-md ${
        selectedCategories.includes(category.value)
          ? "bg-[#dbe9fe]"
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
