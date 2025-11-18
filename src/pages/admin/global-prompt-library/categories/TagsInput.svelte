<script lang="ts">
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
</script>

<Tags
  bind:tags
  autoComplete={tagList}
  autoCompleteKey={"title"}
  placeholder={"Enter a tag name..."}
  onTagClick={(tag: Tag) => console.log("Tag clicked", JSON.stringify(tag))}
  onlyUnique={true}
  onlyAutocomplete={true}
/>

<div class="text-right">
  <button
    class="text-sm underline"
    onclick={() => {
      managerDialog?.show();
    }}
  >
    <span>Manage tags</span>
  </button>
</div>
