<script lang="ts">
  import { navigate } from "astro:transitions/client";
  import type { CreatePromptParams } from "$types/PromptAPI";
  import { useTranslations } from "$i18n/utils";
  import { svgIcons } from "$assets/icons";
  import { onMount } from "svelte";
  import SingleInput from "$components/prompt-library/prompts/SingleInput.svelte";
  import MultiInput from "$components/prompt-library/prompts/MultiInput.svelte";
  import ModelInput from "$components/prompt-library/prompts/ModelInput.svelte";
  import { addToast } from "$stores/toast";
  import TextEditor from "$components/form/TextEditor.svelte";
  import RefinementButton from "$components/prompt-interface/RefinementButton.svelte";
  import LoadingSpinner from "$components/prompt-interface/LoadingSpinner.svelte";
  import Dropdown, { type Option } from "$components/form/Dropdown.svelte";
  import { preventDefault } from "$utils/common";
  import { PromptModel } from "$types/PromptModel";
  import {
    PromptToolOption,
    ReasoningEffortOption,
    TextVerbosityOption,
  } from "$types/AIProvider";
  import { getPromptTools, useProviderInfo } from "$shared/AIProvider";
  import { tenant } from "$stores";
  import {
    normalizeTextToHtml,
    isHtmlContentEmpty,
  } from "$utils/textFormatting";
  import { posthogClientCapture } from "$utils/posthogClient";
  import { EventName, ScreenName } from "$types/Posthog";

  const t = useTranslations();

  type Category = {
    _id: string;
    title: string;
    groups: Group[];
  };

  type Group = { _id: string; title: string };

  type KnowledgeBase = {
    _id: string;
    title: string;
  };

  interface Props {
    currentCategoryId?: string | null;
    currentGroupId?: string | null;
    isEditable?: boolean;
    addPromptDialog?: HTMLDialogElement;
    apiEndPointPrompt?: string;
    apiEndPointCategory?: string;
    apiEndPointKnowledgeBase?: string;
  }

  let {
    currentCategoryId = null,
    currentGroupId = null,
    isEditable = false,
    addPromptDialog = $bindable(),
    apiEndPointPrompt = "/api/prompts/index.json",
    apiEndPointCategory = "/api/categories.json",
    apiEndPointKnowledgeBase = "/api/knowledge-base.json",
  }: Props = $props();

  let categories: Category[] = $state([]);
  let selectedCategory: Category | undefined = $state();
  let selectedGroup: Group | undefined = $state();

  let knowledgeBases: KnowledgeBase[] = $state([]);
  let selectedKnowledgeBases: KnowledgeBase[] = $state([]);

  let selectedModel: string = $state("");
  let selectedPromptTool: any = $state("");

  let selectedReasoningLevel: any = $state("low");
  let selectedTextVerbosity: any = $state("low");

  let promptTitle = $state("");
  let initHtml = $state("<p></p>");
  let promptText = $state("<p></p>");
  let promptPredefinedInput = $state("");

  let titleInput: HTMLInputElement | undefined = $state();

  let isSaving = $state(false);
  let isLoading = $state(false);

  const providerInfo = useProviderInfo($tenant);
  let promptTools: Array<any> = $derived(
    getPromptTools(
      (selectedModel == PromptModel.Default
        ? providerInfo?.defaultProviderPromptModelName
        : selectedModel) as PromptModel,
    ) ?? [],
  );

  onMount(async function () {
    await fetchCategories();
    await fetchKnowledgeBases();
  });

  async function fetchCategories() {
    // Send a GET request to the API endpoint
    const response = await fetch(apiEndPointCategory, { method: "GET" });

    // Parse the JSON response into a typed array of Category objects
    const categoryData = (await response.json()) as Category[];

    // If data is successfully retrieved, update the local variable
    if (categoryData) {
      categories = categoryData;

      // Pre-select category and group if IDs are provided
      if (currentCategoryId) {
        selectedCategory = categories.find(
          (cat) => cat._id === currentCategoryId,
        );
        if (currentGroupId && selectedCategory) {
          selectedGroup = selectedCategory.groups.find(
            (grp) => grp._id === currentGroupId,
          );
        }
      }
    }
  }

  async function fetchKnowledgeBases() {
    // Send a GET request to the API endpoint
    const knowledgeBaseResponse = await fetch(apiEndPointKnowledgeBase, {
      method: "GET",
    });

    // Parse the JSON response into a typed array of KnowledgeBase objects
    const knowledgeBaseData =
      (await knowledgeBaseResponse.json()) as KnowledgeBase[];

    // If data is successfully retrieved, update the local variable
    if (knowledgeBaseData) {
      knowledgeBases = knowledgeBaseData;
    }
  }

  let isFormValid = $derived(
    promptTitle.trim() !== "" &&
      promptText.trim() !== "" &&
      selectedCategory !== undefined &&
      selectedGroup !== undefined,
  );

  async function savePrompt() {
    if (!isFormValid) return;

    isSaving = true;
    try {
      const newPrompt: CreatePromptParams = {
        title: promptTitle,
        prompt: promptText,
        predefined_input: promptPredefinedInput,
        model: selectedModel ?? null,
        reasoningEffort: selectedReasoningLevel || null,
        textVerbosity: selectedTextVerbosity || null,
        promptTool: selectedPromptTool || null,
        knowledgebase: selectedKnowledgeBases.map((kb) => kb._id),
        ...(selectedCategory && { category: selectedCategory._id }),
        ...(selectedGroup && { group: selectedGroup._id }),
      };

      const response = await fetch(apiEndPointPrompt, {
        method: "POST",
        body: JSON.stringify(newPrompt),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || t("prompt-library.add.prompt.failed"),
        );
      }

      const data = await response.json();

      posthogClientCapture($tenant, EventName.AiboxAssistantSaved, {
        page_name: ScreenName.AddPromptDialog,
        use_case: promptTitle || "-",
      });

      navigate(window.location.href);

      addToast({
        message: data.message,
        type: "success",
      });
    } catch (error) {
      addToast({
        message:
          error instanceof Error ? error.message : t("common.unexpected.error"),
        type: "error",
      });
    } finally {
      isSaving = false;
    }
  }

  function closeDialog() {
    addPromptDialog?.close();
    promptTitle = "";
    promptText = "<p></p>";
    selectedKnowledgeBases = [];
  }

  function handleKeyDown(event: any) {
    if (event.key === "Enter") {
      event.preventDefault();
    }
  }
</script>

<dialog class="modal" bind:this={addPromptDialog}>
  <div class="modal-box w-8/12 max-w-5xl relative">
    <div class="flex justify-between">
      <h3 class="text-lg font-bold py-4">{t("prompt-library.prompts.add")}</h3>
      <button class="btn btn-sm btn-circle btn-ghost" onclick={closeDialog}>
        {@html svgIcons.closeMenu}
      </button>
    </div>

    <form class="rounded-sm pt-6 mb-4 space-y-6">
      <!-- Prompt Title -->
      <div class="grid grid-cols-1 gap-4 justify-center">
        <div>
          <p class="mb-2">{t("prompt-library.add.prompts.title")}*</p>
          <input
            type="text"
            bind:value={promptTitle}
            placeholder="e.g. Create three sports headlines"
            class="input input-bordered w-full min-w-xs"
            onkeydown={handleKeyDown}
            bind:this={titleInput}
          />
        </div>
      </div>

      <!-- Instructions -->
      <div class="mb-4 relative">
        <p class="mb-2">{t("prompt-library.add.prompts.instructions")}*</p>
        {#key initHtml}
          <TextEditor
            oncreate={() => {
              setTimeout(() => {
                titleInput?.focus({ preventScroll: true });
              }, 100);
            }}
            bind:html={promptText}
            cssClass="h-[200px] mt-3"
          />
        {/key}
        <RefinementButton
          {promptText}
          {selectedModel}
          bind:isLoading
          disabled={isHtmlContentEmpty(promptText)}
          onResultReady={(output: string) => {
            initHtml = normalizeTextToHtml(output);
            promptText = normalizeTextToHtml(output);
          }}
        />
      </div>

      <!-- Predfined input -->
      <div class="mb-4">
        <p class="mb-2">{t("prompt-library.add.prompts.predefined-input")}</p>
        <textarea
          bind:value={promptPredefinedInput}
          placeholder=""
          class="input input-bordered min-w-xs shadow-sm appearance-none min-h-32 w-full py-2 px-3"
        ></textarea>
      </div>

      <!-- Knowledge Base & AI Features -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 justify-center"
      >
        <MultiInput
          title={t("prompt-library.add.prompts.knowledge-base")}
          placeholder="e.g. Knowledge base"
          items={knowledgeBases}
          bind:selectedItems={selectedKnowledgeBases}
        />
        <ModelInput
          bind:selectedModel
          onValueChange={(_value: any) => {
            selectedPromptTool = PromptToolOption.None;
          }}
        />
      </div>

      <!-- Prompt Tools -->
      {#if Array.isArray(promptTools) && promptTools.length > 0}
        <div
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 justify-center"
        >
          <div class={"flex-1 min-w-3xs "}></div>

          <Dropdown
            classes={"flex-1 min-w-3xs "}
            label={t("prompt-execution.prompt-tool")}
            placeholder={t("prompt-execution.prompt-tool.placeholder")}
            options={[
              {
                title: t("prompt-execution.prompt-tool.placeholder"),
                value: PromptToolOption.None,
              },
              ...promptTools.map((item: Option) => {
                return {
                  title: item.title,
                  value: item.value,
                };
              }),
            ]}
            bind:value={selectedPromptTool}
          />
        </div>
      {/if}

      <!-- Reasoning & Verbosity -->
      {#if selectedModel.includes(PromptModel.OpenAIGpt5)}
        <div
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 justify-center"
        >
          <Dropdown
            classes={"flex-1 min-w-3xs "}
            label={t("prompt-execution.reasoning-level")}
            placeholder={t("prompt-execution.reasoning-level.placeholder")}
            options={[
              {
                title: t("prompt-execution.reasoning-effort.level-minimal"),
                value: ReasoningEffortOption.Minimal,
              },
              {
                title: t("prompt-execution.reasoning-effort.level-low"),
                value: ReasoningEffortOption.Low,
              },
              {
                title: t("prompt-execution.reasoning-effort.level-medium"),
                value: ReasoningEffortOption.Medium,
              },
              {
                title: t("prompt-execution.reasoning-effort.level-high"),
                value: ReasoningEffortOption.High,
              },
            ]}
            bind:value={selectedReasoningLevel}
          />

          <Dropdown
            classes={"flex-1 min-w-3xs "}
            label={t("prompt-execution.text-verbosity")}
            placeholder={t("prompt-execution.text-verbosity.placeholder")}
            options={[
              {
                title: t("prompt-execution.verbosity.level-low"),
                value: TextVerbosityOption.Low,
              },
              {
                title: t("prompt-execution.verbosity.level-medium"),
                value: TextVerbosityOption.Medium,
              },
              {
                title: t("prompt-execution.verbosity.level-high"),
                value: TextVerbosityOption.High,
              },
            ]}
            bind:value={selectedTextVerbosity}
          />
        </div>
      {/if}

      <!-- Category & Group -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 justify-center"
      >
        <SingleInput
          title={`${t("prompt-library.add.prompts.category")}*`}
          placeholder="e.g. Editing"
          items={categories}
          bind:selectedItem={selectedCategory}
          disabled={currentCategoryId !== null}
        />

        {#if selectedCategory}
          <SingleInput
            title={`${t("prompt-library.add.prompts.group")}*`}
            placeholder="e.g. Headlines"
            items={selectedCategory.groups}
            bind:selectedItem={selectedGroup}
            disabled={currentGroupId !== null}
          />
        {/if}
      </div>

      <!-- Save button -->
      {#if isEditable}
        <div class="flex items-center justify-end">
          <button
            class="btn btn-outline px-8 font-normal mr-2"
            onclick={preventDefault(closeDialog)}
          >
            {t("common.cancel")}
          </button>
          <button
            class={`btn btn-active btn-primary px-8 font-normal ${(!isFormValid || isSaving) && "btn-disabled"}`}
            onclick={preventDefault(savePrompt)}
          >
            {#if isSaving}
              <span class="loading loading-spinner"></span>
              {t("prompt-library.add.prompts.saving")}
            {:else}
              {t("prompt-library.add.prompts.save")}
            {/if}
          </button>
        </div>
      {/if}
    </form>

    <LoadingSpinner {isLoading} />
  </div>
</dialog>
