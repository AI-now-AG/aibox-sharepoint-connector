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

  let emojiDialog: HTMLDialogElement;
  let iconPickerDialog: HTMLDialogElement;
  let selectedTag: TagItem | null = null;

  function openIconPicker(tag: TagItem) {
    selectedTag = tag;
    iconPickerDialog.showModal();
  }

  async function chooseEmoji() {
    emojiDialog?.showModal();
    iconPickerDialog.close();
  }

  function chooseImage() {
    if (!selectedTag) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement)?.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async () => {
        selectedTag!.icon = reader.result as string;
        await updateTag(selectedTag!);
      };
      reader.readAsDataURL(file);
    };

    input.click();
    iconPickerDialog.close();
  }

  async function deleteTag(id: string) {
    await fetch("/api/admin/global-tags.json", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id: id }),
    });
    await loadTags();
  }

  function setupEmojiPicker() {
    if (document) {
      const picker = document.querySelector("emoji-picker");
      if (picker) {
        picker.addEventListener("emoji-click", async (event: any) => {
          console.log((event as CustomEvent).detail);
          const detail = (event as CustomEvent).detail;
          const emoji = detail?.unicode || "";
          if (emoji && selectedTag) {
            console.log("emoji && selectedTag", emoji, selectedTag);
            selectedTag.icon = emoji;
            emojiDialog?.close();
            await updateTag(selectedTag);
          }
        });
      }
    }
  }

  onMount(() => {
    loadTags();
    setupEmojiPicker();
  });

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

        <input
          type="color"
          class="w-10 h-10 rounded cursor-pointer"
          bind:value={tag.iconColor}
          oninput={() => updateTag(tag)}
        />

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

    <div></div>
  </div>
</dialog>

<!-- ICON PICKER MODAL -->
<dialog bind:this={iconPickerDialog} class="modal">
  <div class="modal-box max-w-sm">
    <h3 class="font-bold text-lg mb-4">Choose Icon</h3>

    <div class="grid grid-cols-1 gap-3">
      <!-- Emoji Button -->
      <button
        class="btn btn-outline w-full flex items-center gap-2"
        onclick={() => chooseEmoji()}
      >
        😊 <span>Choose Emoji</span>
      </button>

      <!-- Image Upload Button -->
      <button
        class="btn btn-outline w-full flex items-center gap-2"
        onclick={() => chooseImage()}
      >
        🖼️ <span>Upload Image</span>
      </button>
    </div>

    <div class="modal-action">
      <button class="btn" onclick={() => iconPickerDialog.close()}>
        Close
      </button>
    </div>
  </div>
</dialog>

<!-- EMOJI PICKER MODAL -->
<dialog bind:this={emojiDialog} class="modal">
  <div class="modal-box max-w-sm">
    <h3 class="font-bold text-lg mb-4">Choose Emoji</h3>

    <emoji-picker class="light"></emoji-picker>

    <div class="modal-action">
      <button class="btn" onclick={() => emojiDialog.close()}> Close </button>
    </div>
  </div>
</dialog>
