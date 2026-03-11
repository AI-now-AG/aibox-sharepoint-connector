<script lang="ts">
  import { onMount } from "svelte";
  import { svgIcons } from "$assets/icons";
  import { type TagItem } from "$types/TagInput";
  import { useTranslations } from "$i18n/utils";
  import { bgOpacity } from "$utils/common";
  import CategoriesInput from "./CategoriesInput.svelte";
  import Loading from "$components/Loading.svelte";

  interface Props {
    resellerCodes: string[];
  }

  let { resellerCodes = [] }: Props = $props();
  const categories = ["self-onboarding", ...resellerCodes];

  const t = useTranslations();

  const defaultTagIconColor = "#491EFF";

  let tags: TagItem[] = $state([]);
  let newTitle: string = $state("");
  let loading: boolean = $state(false);

  let emojiDialog: HTMLDialogElement;
  let iconPickerDialog: HTMLDialogElement;
  let selectedTag: TagItem | null = null;

  onMount(() => {
    loadTags();
    setupEmojiPicker();
  });

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
      categories: item.categories ?? [],
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

  async function deleteTag(id: string) {
    await fetch("/api/admin/global-tags.json", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id: id }),
    });
    await loadTags();
  }

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
</script>

<div
  class="container max-w-5xl p-6 mx-auto grid grid-cols-1 md:grid-cols-[1fr_max-content] sticky bg-base-200 top-0 z-40"
>
  <div class="flex items-center pt-5 pb-2">
    <button class="mr-4" onclick={() => window.history.back()}>
      {@html svgIcons.back}
    </button>
    <h1 class="text-4xl font-bold">
      {t("prompt-library.global.manage-tags")}
    </h1>
  </div>
</div>
<div class="container max-w-5xl p-6 mx-auto mb-10">
  <div class="flex gap-2 mb-2">
    <input
      type="text"
      class="input input-md input-bordered w-full"
      placeholder={t("prompt-library.global.new-tag-title")}
      bind:value={newTitle}
      onkeydown={(e) => e.key === "Enter" && createTag()}
    />
    <button class="btn btn-md btn-primary" onclick={createTag}
      >{t("common.add")}</button
    >
  </div>

  <div class="divider"></div>

  {#each tags as tag (tag._id)}
    <div class="flex items-center gap-3 mb-2">
      <!-- TITLE -->
      <input
        class="input input-md input-bordered flex-1"
        bind:value={tag.title}
        onblur={() => updateTag(tag)}
      />

      <!-- DESCRIPTION -->
      <input
        class="input input-md input-bordered flex-[1.5]"
        placeholder="Description"
        bind:value={tag.description}
        onblur={() => updateTag(tag)}
      />

      <!-- RESELLER CODES -->
      <div class="w-64">
        <CategoriesInput
          placeholder="Select categories"
          items={categories}
          bind:selectedItems={tag.categories}
          onchange={() => updateTag(tag)}
        />
      </div>

      <!-- ICON PICKER -->
      <div class="relative flex justify-center items-center">
        <button
          class="btn btn-sm h-[36px] w-[36px] w-full border rounded-lg flex justify-center items-center"
          style={`background:${bgOpacity(tag.iconColor || defaultTagIconColor)}`}
          onclick={() => openIconPicker(tag)}
        >
          {#if tag.icon}
            {#if tag.icon.startsWith("data:image")}
              <img src={tag.icon} alt="" class="w-6 h-6 rounded object-cover" />
            {:else}
              <span class="text-2xl">{tag.icon}</span>
            {/if}
          {:else}
            <span class="text-2xl opacity-60">🇨🇭</span>
          {/if}
        </button>
      </div>

      <input
        type="color"
        class="w-10 h-10 rounded cursor-pointer"
        bind:value={tag.iconColor}
        onblur={() => updateTag(tag)}
      />

      <!-- DELETE -->
      <button
        class="btn btn-sm w-[46px] flex justify-center items-center text-red-600 hover:bg-gray-200 bg-red-200"
        onclick={() => deleteTag(tag._id)}
      >
        {@html svgIcons.trash}
      </button>
    </div>
  {/each}
</div>

<!-- ICON PICKER MODAL -->
<dialog bind:this={iconPickerDialog} class="modal">
  <div class="modal-box max-w-sm">
    <h3 class="font-bold text-lg mb-4">{t("common.choose-icon")}</h3>

    <div class="grid grid-cols-1 gap-3">
      <!-- Emoji Button -->
      <button
        class="btn btn-outline w-full flex items-center gap-2"
        onclick={() => chooseEmoji()}
      >
        😊 <span>{t("common.choose-emoji")}</span>
      </button>

      <!-- Image Upload Button -->
      <button
        class="btn btn-outline w-full flex items-center gap-2"
        onclick={() => chooseImage()}
      >
        🖼️ <span>{t("common.choose-image")}</span>
      </button>
    </div>

    <div class="modal-action">
      <button class="btn" onclick={() => iconPickerDialog.close()}>
        {t("common.close")}
      </button>
    </div>
  </div>
</dialog>

<!-- EMOJI PICKER MODAL -->
<dialog bind:this={emojiDialog} class="modal">
  <div class="modal-box max-w-sm">
    <h3 class="font-bold text-lg mb-4">{t("common.choose-emoji")}</h3>

    <emoji-picker class="light"></emoji-picker>

    <div class="modal-action">
      <button class="btn" onclick={() => emojiDialog.close()}>
        {t("common.close")}
      </button>
    </div>
  </div>
</dialog>

<Loading show={loading} />
