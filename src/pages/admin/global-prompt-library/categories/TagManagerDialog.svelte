<script lang="ts">
  import { onMount } from "svelte";
  import { navigate } from "astro:transitions/client";
  import { svgIcons } from "$assets/icons";
  import { type TagItem } from "$types/TagInput";
  import { useTranslations } from "$i18n/utils";

  interface Props {
    tagDialog?: HTMLDialogElement;
  }

  let { tagDialog = $bindable() }: Props = $props();

  const t = useTranslations();

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
      description: item.description ?? "",
      icon: item.icon ?? "🇨🇭",
      iconColor: item.iconColor ?? "#491EFF",
    }));
    loading = false;
  }

  async function createTag() {
    if (!newTitle.trim()) return;
    await fetch("/api/admin/global-tags.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, description: "", icon: "" }),
    });
    newTitle = "";
    await loadTags();
  }

  async function updateTag(tag: TagItem) {
    await fetch("/api/admin/global-tags.json", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tag),
    });
  }

  function pickEmoji(tag: TagItem) {
    const emoji = prompt("Enter emoji:");
    if (!emoji) return;
    tag.icon = emoji;
    updateTag(tag);
  }

  function pickImage(tag: TagItem) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement | null;
      const file = target?.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        tag.icon = reader.result as string; // base64 result
        updateTag(tag);
      };
      reader.readAsDataURL(file);
    };

    input.click();
  }

  function openIconPicker(tag: TagItem) {
    const choice = confirm("OK = Emoji, Cancel = Upload Image");
    if (choice) pickEmoji(tag);
    else pickImage(tag);
  }

  async function deleteTag(id: string) {
    await fetch("/api/admin/global-tags.json", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id: id }),
    });
    await loadTags();
  }

  onMount(loadTags);

  function cancelEdit() {
    tagDialog?.close();
    navigate(window.location.href);
  }
</script>

<dialog class="modal" bind:this={tagDialog}>
  <div class="modal-box w-8/12 max-w-6xl relative">
    <div class="flex justify-between">
      <h3 class="text-lg font-bold py-4">
        {t("prompt-library.global.manage-tags")}
      </h3>
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
      <div class="flex items-center gap-3 mb-3">
        <!-- TITLE -->
        <input
          class="input input-sm input-bordered flex-1"
          bind:value={tag.title}
          oninput={() => updateTag(tag)}
        />

        <!-- DESCRIPTION -->
        <input
          class="input input-sm input-bordered flex-[1.5]"
          placeholder="Description"
          bind:value={tag.description}
          oninput={() => updateTag(tag)}
        />

        <!-- ICON PICKER -->
        <div class="relative w-[70px] flex justify-center items-center">
          <button
            class="btn btn-sm w-full border rounded-lg flex justify-center items-center"
            onclick={() => openIconPicker(tag)}
          >
            {#if tag.icon}
              {#if tag.icon.startsWith("data:image")}
                <img
                  src={tag.icon}
                  alt=""
                  class="w-6 h-6 rounded object-cover"
                />
              {:else}
                <span class="text-2xl">{tag.icon}</span>
              {/if}
            {:else}
              <span class="text-xs opacity-60">Icon</span>
            {/if}
          </button>
        </div>

        <!-- DELETE -->
        <button
          class="btn btn-sm btn-error w-[50px] flex justify-center items-center"
          onclick={() => deleteTag(tag._id)}
        >
          {@html svgIcons.trash}
        </button>
      </div>
    {/each}

    {#if loading}
      <p>{t("common.loading")}...</p>
    {/if}
  </div>
</dialog>
