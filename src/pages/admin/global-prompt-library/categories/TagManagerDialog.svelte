<script lang="ts">
  import { onMount } from "svelte";
  import { navigate } from "astro:transitions/client";
  import { svgIcons } from "$assets/icons";
  import { type TagItem } from "$types/TagInput";

  interface Props {
    tagDialog?: HTMLDialogElement;
  }

  let { tagDialog = $bindable() }: Props = $props();

  let tags: TagItem[] = $state([]);
  let newTitle: string = $state("");
  let loading: boolean = $state(false);

  async function loadTags() {
    loading = true;
    const res = await fetch("/api/admin/global-tags.json");
    const data = await res.json();

    tags = data.map((item: TagItem) => ({
      _id: item._id,
      title: item.title,
    }));
    loading = false;
  }

  async function createTag() {
    if (!newTitle.trim()) return;
    const res = await fetch("/api/admin/global-tags.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
    newTitle = "";
    await loadTags();
  }

  async function updateTag(tag: TagItem) {
    await fetch("/api/admin/global-tags.json", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id: tag._id, title: tag.title }),
    });
    await loadTags();
  }

  async function deleteTag(id: string) {
    await fetch("/api/admin/global-tags.json", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id: id }),
    });
    await loadTags();
  }

  onMount(async () => {
    loadTags();
  });

  function cancelEdit() {
    tagDialog?.close();
    navigate(window.location.href);
  }
</script>

<dialog class="modal" bind:this={tagDialog}>
  <div class="modal-box w-8/12 max-w-3xl relative">
    <div class="flex justify-between">
      <h3 class="text-lg font-bold py-4">Manage Tags</h3>
      <button class="btn btn-sm btn-circle btn-ghost" onclick={cancelEdit}>
        {@html svgIcons.closeMenu}
      </button>
    </div>

    <div class="flex gap-2 mb-2">
      <input
        type="text"
        class="input input-sm input-bordered w-full"
        placeholder="New tag title"
        bind:value={newTitle}
        onkeydown={(e) => e.key === "Enter" && createTag()}
      />
      <button class="btn btn-sm btn-primary" onclick={createTag}>Add</button>
    </div>

    <div class="divider"></div>

    {#each tags as tag (tag._id)}
      <div class="flex gap-2 mb-2">
        <input
          type="text"
          class="input input-sm input-bordered w-full"
          bind:value={tag.title}
          onblur={() => updateTag(tag)}
          onkeydown={(e) => e.key === "Enter" && updateTag(tag)}
        />
        <button
          class="btn btn-sm btn-error"
          onclick={async () => deleteTag(tag._id)}
          >{@html svgIcons.trash}</button
        >
      </div>
    {/each}

    {#if loading}
      <p>Loading...</p>
    {/if}
  </div>
</dialog>
