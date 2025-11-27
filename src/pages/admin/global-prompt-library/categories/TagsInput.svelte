<script lang="ts">
  import { useTranslations } from "$i18n/utils";
  import Tags, { type Tag } from "svelte-tags-input";

  interface Props {
    tagList: Tag[];
    tags: Tag[];
    managerDialog: HTMLDialogElement | undefined;
  }

  let {
    tagList,
    tags = $bindable([]),
    managerDialog = $bindable(),
  }: Props = $props();

  const t = useTranslations();
</script>

<div class="my-tags-input">
  <Tags
    bind:tags
    autoComplete={tagList}
    autoCompleteKey={"title"}
    placeholder={"Enter a tag name..."}
    onTagClick={(tag: Tag) => console.log("Tag clicked", JSON.stringify(tag))}
    onlyUnique={true}
    onlyAutocomplete={true}
  />
</div>

<div class="text-right">
  <button
    class="text-sm underline"
    onclick={() => {
      managerDialog?.show();
    }}
  >
    <span>{t("prompt-library.global.manage-tags")}</span>
  </button>
</div>

<style>
  .my-tags-input :global(.svelte-tags-input-layout) {
    min-height: 40px;
    border-radius: 8px;
    border-color: #dcdbdf;
  }
  .my-tags-input :global(.svelte-tags-input-tag) {
    background-color: #491eff;
    border-radius: 5px;
  }

  .my-tags-input :global(.svelte-tags-input-matchs) {
    z-index: 999;
  }

  .my-tags-input :global(.svelte-tags-input-matchs li:hover),
  .my-tags-input :global(.svelte-tags-input-matchs li.focus) {
    background-color: #eee;
    color: #3527a9;
  }
</style>
