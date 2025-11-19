<script lang="ts">
  import PromptFilter from "$components/prompt-interface/PromptFilter.svelte";
  import PromptList, { type PromptCartItem } from "./PromptList.svelte";
  import type { CategoryItem } from "$types/CategoryItem";

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

  let filteredPrompts = $state(promptsEnriched);
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
