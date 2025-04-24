<script lang="ts">
  import { actions } from "astro:actions";
  import { useTranslations } from "$i18n/utils";
  import { tenant } from "$stores";
  import { addToast } from "$stores/toast";
  import { svgIcons } from "$assets/icons";
  import { AudioCategory } from "$types/TenantFeature";
  import { onMount } from "svelte";
  import { formatMarkdown, preventDefault } from "$utils/common";
  import TextEditor from "$components/TextEditor.svelte";
  const t = useTranslations();

  interface Props {
    preDefineCategory: AudioCategory[];
    instructionTitle?: string | undefined;
    instructionText?: string | undefined;
    category?: AudioCategory | undefined;
    isEnabled?: boolean;
    isNew?: boolean;
    selectedUsecaseId?: string | undefined;
    isEditable: boolean;
    mode?: "create" | "update" | "clone";
  }

  let {
    preDefineCategory = [],
    instructionTitle = "",
    instructionText = "<p></p>",
    category,
    isEnabled = true,
    isNew = true,
    selectedUsecaseId,
    isEditable = false,
    mode: screenMode,
  }: Props = $props();

  instructionText = formatMarkdown(instructionText);

  let titleInput: HTMLInputElement | undefined = $state();

  let isSaving = $state(false);
  let isFormValid = $derived(
    instructionTitle.trim() !== "" &&
      instructionText.trim() !== "" &&
      instructionText.trim() !== "<p></p>" &&
      category !== undefined &&
      isEnabled !== undefined,
  );
  let mode = $state(screenMode ?? (isNew ? "create" : "update"));

  let subtitleList = $state(
    [
      preDefineCategory.includes(AudioCategory.Subtitle) && {
        title: t("settings.transcription.subtitle-standard"),
        checked: category === AudioCategory.Subtitle,
        category: AudioCategory.Subtitle,
      },
      preDefineCategory.includes(AudioCategory.SubtitleLarge) && {
        title: t("settings.transcription.subtitle-large"),
        checked: category === AudioCategory.SubtitleLarge,
        category: AudioCategory.SubtitleLarge,
      },
      preDefineCategory.includes(AudioCategory.SubtitleJson) && {
        title: t("settings.transcription.subtitles-title-json"),
        checked: category === AudioCategory.SubtitleJson,
        category: AudioCategory.SubtitleJson,
      },
      preDefineCategory.includes(AudioCategory.Subtitle11Labs) && {
        title: t("tenant.subtitle-elevenLabs"),
        checked: category === AudioCategory.Subtitle11Labs,
        category: AudioCategory.Subtitle11Labs,
      }
    ].filter(Boolean),
  );

  const inputValue = $derived(
    subtitleList
      .filter(
        (
          e,
        ): e is { title: string; checked: boolean; category: AudioCategory } =>
          e !== false && e.checked === true,
      )
      .map((e) => e.title)
      .join(", "),
  );

  onMount(() => {
    if (mode == "clone") {
      isNew = true;
      instructionTitle =
        instructionTitle?.trim() + " (" + t("common.copy") + ")";
    }
  });

  async function createInstruction() {
    if (!category) return;
    isSaving = true;

    const transcriptionCreate = {
      name: instructionTitle,
      tenant_id: $tenant!._id.toString(),
      category: category,
      enabled: isEnabled,
      text: instructionText,
    };

    const { error } = await actions.transcription.create(transcriptionCreate);
    isSaving = false;

    if (error) {
      addToast({
        message: error.message,
        type: "error",
      });
    } else {
      addToast({
        message: "Created",
        type: "success",
      });
      setTimeout(() => {
        reloadPage();
      }, 1000);
    }
  }

  async function updateInstruction() {
    if (!category) return;
    if (selectedUsecaseId === undefined) return;
    isSaving = true;
    const transcriptionUpdate = {
      _id: selectedUsecaseId,
      name: instructionTitle,
      tenant_id: $tenant!._id.toString(),
      category: category,
      enabled: isEnabled,
      text: instructionText,
    };

    const { error } = await actions.transcription.update(transcriptionUpdate);
    isSaving = false;

    if (error) {
      addToast({
        message: error.message,
        type: "error",
      });
    } else {
      addToast({
        message: "Updated",
        type: "success",
      });
      setTimeout(() => {
        window.location.assign(document.referrer || "/settings/transcription");
      }, 1000);
    }
  }

  function reloadPage(delay = 1500) {
    setTimeout(() => {
      window.history.back();
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }, delay);
  }

  function goback() {
    window.history.back();
  }

  function handleSelectedItems(selected: any) {
    const selectedIndex = subtitleList.indexOf(selected);
    if (selectedIndex !== -1) {
      subtitleList = subtitleList.map((item, idx) => {
        if (item && item.title && item.category) {
          return {
            ...item,
            checked: idx === selectedIndex,
          };
        }
        return item;
      });
      category = selected.category;
    }
  }
</script>

<div
  class="container max-w-5xl mx-auto p-6 grid grid-cols-3 md:grid-cols-[1fr_max-content] gap-8"
>
  <div class="w-full min-w-xs">
    <div class="flex items-center pt-2 pb-6">
      <button class="mr-4" onclick={goback}>
        {@html svgIcons.back}
      </button>
      <h1 class="text-4xl font-bold">
        {t("prompt-library.instructions.edit")}
      </h1>
    </div>
    <form class="pt-6 mb-4 space-y-6">
      <div class="grid grid-cols-1 gap-4 justify-center">
        <div>
          <p class="mb-2">{t("prompt-library.add.knowledgebase.title")}</p>
          <label class="input input-bordered flex items-center gap-2 w-full">
            <input
              type="text"
              bind:value={instructionTitle}
              placeholder="title"
              bind:this={titleInput}
            />
            <!-- {@html svgIcons.Lock} -->
          </label>
        </div>
      </div>
      {#if preDefineCategory.includes(AudioCategory.Subtitle || AudioCategory.SubtitleLarge || AudioCategory.SubtitleJson)}
        <div class="mb-4">
          <p class="mb-2">{t("prompt-library.add.prompts.group")}</p>
          <div class="dropdown dropdown-bottom min-w-xs">
            <label
              class="input input-bordered flex flex-row items-center gap-2"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                class="mr-2 flex-none"
              >
                <path
                  d="M13 13L9 9M10.3333 5.66667C10.3333 8.244 8.244 10.3333 5.66667 10.3333C3.08934 10.3333 1 8.244 1 5.66667C1 3.08934 3.08934 1 5.66667 1C8.244 1 10.3333 3.08934 10.3333 5.66667Z"
                  stroke="#111827"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>

              <input
                type="text"
                placeholder={t(
                  "audiotools.subtitles.select.languageTranscription",
                )}
                value={inputValue}
                role="button"
                class="w-auto min-w-0 font-medium grow"
                readonly
              />
              <svg
                width="12"
                height="7"
                viewBox="0 0 12 7"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                class="flex-none"
              >
                <path
                  d="M10.6663 1L5.99967 5.66667L1.33301 1"
                  stroke="#111827"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </label>
            {#if subtitleList}
              <ul
                tabindex="-1"
                class="dropdown-content menu bg-base-100 space-y-2 rounded-box z-1 w-52 p-2 shadow-sm"
              >
                {#each subtitleList as item}
                  <li>
                    <button
                      onclick={preventDefault(() => handleSelectedItems(item))}
                      class={`${item && item.checked === true ? "bg-primary text-primary-content hover:bg-primary" : "hover:text-neutral"}`}
                    >
                      {item && item.title}
                    </button>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        </div>
      {/if}
      <div class="mb-4">
        <p class="mb-2">{t("prompt-library.add.knowledgebase.text")}</p>

        <TextEditor
          blur={() => {
            setTimeout(() => {
              titleInput?.focus({ preventScroll: true });
            }, 100);
          }}
          bind:html={instructionText}
        />
      </div>

      {#if isEditable}
        <div class="flex items-center justify-between">
          <button
            class={`btn btn-active btn-primary px-8 font-normal ${(!isFormValid || isSaving) && "btn-disabled"}`}
            onclick={isNew
              ? preventDefault(createInstruction)
              : preventDefault(updateInstruction)}
          >
            {#if isSaving}
              <span class="loading loading-spinner"></span>
              {t("prompt-library.add.prompts.saving")}
            {:else}
              {t("prompt-library.add.knowledgebase.save")}
            {/if}
          </button>
        </div>
      {/if}
    </form>
  </div>
</div>
