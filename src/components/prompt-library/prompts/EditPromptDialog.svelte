<script lang="ts">
  import { onMount } from "svelte";
  import { navigate } from "astro:transitions/client";
  import { useTranslations } from "$i18n/utils";
  import SingleInput from "$components/prompt-library/prompts/SingleInput.svelte";
  import MultiInput from "$components/prompt-library/prompts/MultiInput.svelte";
  import ModelInput from "$components/prompt-library/prompts/ModelInput.svelte";
  import KBTypeCard from "$components/prompt-library/prompts/KBTypeCard.svelte";
  import type { CreatePromptParams } from "$types/PromptAPI";
  import { addToast } from "$stores/toast";
  import RefinementButton from "$components/prompt-interface/RefinementButton.svelte";
  import LoadingSpinner from "$components/prompt-interface/LoadingSpinner.svelte";
  import { svgIcons } from "$assets/icons";
  import { preventDefault } from "$utils/common";
  import TextEditor from "$components/form/TextEditor.svelte";
  import Dropdown, { type Option } from "$components/form/Dropdown.svelte";
  import { PromptModel } from "$types/PromptModel";
  import {
    PromptToolOption,
    ReasoningEffortOption,
    TextVerbosityOption,
    VectorKBScope,
  } from "$types/AIProvider";
  import { getPromptTools, useProviderInfo } from "$shared/AIProvider";
  import { tenant } from "$stores";
  import {
    normalizeTextToHtml,
    isHtmlContentEmpty,
  } from "$utils/textFormatting";
  import { EventName, ScreenName } from "$types/Posthog";
  import { posthogClientCapture } from "$utils/posthogClient";
  import VectorKBScopeSelector from "$components/prompt-library/vector-kb/VectorKBScopeSelector.svelte";

  const t = useTranslations();

  interface Props {
    isEditable?: boolean;
    selectedEditPromptId?: any;
    promptDialog?: HTMLDialogElement;
    dialogMode?: "create" | "update" | "clone";
    dialogTitle?: string;
    apiEndPointPrompt?: string;
    apiEndPointCategory?: string;
    apiEndPointKnowledgeBase?: string;
  }

  let {
    isEditable = true,
    selectedEditPromptId = $bindable(null),
    promptDialog = $bindable(),
    dialogMode = "update",
    dialogTitle = t("assistant-dialog.title.edit"),
    apiEndPointPrompt = "/api/prompts/index.json",
    apiEndPointCategory = "/api/categories.json",
    apiEndPointKnowledgeBase = "/api/knowledge-base.json",
  }: Props = $props();

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

  type KBType = "none" | "basic" | "advanced";

  let categories: Category[] = $state([]);
  let selectedCategory: Category | undefined = $state();

  let knowledgeBases: KnowledgeBase[] = $state([]);
  let selectedKnowledgeBases: KnowledgeBase[] = $state([]);

  let selectedModel: string = $state("");
  let selectedPromptTool: any = $state("");

  let selectedReasoningLevel: any = $state(ReasoningEffortOption.None);
  let selectedTextVerbosity: any = $state(TextVerbosityOption.Low);

  let selectedGroup: Group | any = $state();
  let previousCategoryId: string | null = $state(null);

  let promptTitle = $state("");
  let initHtml = $state("");
  let promptText = $state("");
  let promptPredefinedInput = $state("");

  let promptDetails: any | undefined = $state();

  let isSaving = $state(false);
  let isLoading = $state(false);

  let isDataLoaded = false;

  let titleInput: HTMLInputElement | undefined = $state();

  // Knowledge Base type state
  let kbType = $state<KBType>("none");

  // Vector KB state
  let vectorKbEnabled = $state(false);
  let vectorKbScope = $state<VectorKBScope>(VectorKBScope.All);
  let vectorKbFolderIds = $state<string[]>([]);
  let vectorKbDataSourceIds = $state<string[]>([]);

  // Check if tenant has Vector KB enabled
  const tenantVectorKbEnabled = $derived($tenant?.vector_kb_enabled ?? false);

  const providerInfo = useProviderInfo($tenant);

  let promptTools: Array<any> = $derived(
    getPromptTools(
      (selectedModel == PromptModel.Default
        ? providerInfo?.defaultProviderPromptModelName
        : selectedModel) as PromptModel,
    ) ?? [],
  );

  onMount(async () => {
    const categoryResponse = await fetch(apiEndPointCategory, {
      method: "GET",
    });
    const categoryData = (await categoryResponse.json()) as Category[];
    if (categoryData) {
      categories = categoryData;
    }

    const knowledgeBaseResponse = await fetch(apiEndPointKnowledgeBase, {
      method: "GET",
    });
    const knowledgeBaseData =
      (await knowledgeBaseResponse.json()) as KnowledgeBase[];
    if (knowledgeBaseData) {
      knowledgeBases = knowledgeBaseData;
    }
  });

  async function getPromptDetail(id: string) {
    isLoading = true;
    try {
      const response = await fetch(`${apiEndPointPrompt}?_id=${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            "Failed to get prompt details. Please try again.",
        );
      }

      promptDetails = await response.json();
      promptTitle = promptDetails.title;
      if (dialogMode == "clone") {
        promptTitle = promptTitle?.trim() + " (" + t("common.copy") + ")";
      }
      promptText = normalizeTextToHtml(promptDetails.prompt);
      initHtml = normalizeTextToHtml(promptDetails.prompt);
      promptPredefinedInput = promptDetails.predefined_input;

      const category = categories.find(
        (e) => e._id == promptDetails.category?.toString(),
      );
      if (category) {
        selectedCategory = category;
        previousCategoryId = category._id;
      }

      selectedModel = promptDetails.model?.toString() || "";
      // Handle deprecated models
      if (
        [
          PromptModel.OpenAIWithTools,
          PromptModel.OpenAIWithImageTools,
        ].includes(selectedModel as PromptModel)
      ) {
        selectedModel = PromptModel.OpenAI;
      }

      selectedReasoningLevel =
        promptDetails.reasoningEffort || ReasoningEffortOption.None;
      selectedTextVerbosity =
        promptDetails.textVerbosity || TextVerbosityOption.Low;

      selectedPromptTool = promptDetails.promptTool || "";

      const group = category?.groups.find(
        (e) => e._id == promptDetails.group?.toString(),
      );
      if (group) {
        selectedGroup = group;
      }
      selectedKnowledgeBases = promptDetails.knowledgebase
        .map((kbObj: any) =>
          knowledgeBases.find((e) => e._id == kbObj._id.toString()),
        )
        .filter((kb: any) => kb !== undefined) as KnowledgeBase[];

      // Populate Vector KB state
      vectorKbEnabled = promptDetails.vector_kb_enabled || false;
      vectorKbScope = promptDetails.vector_kb_scope || VectorKBScope.All;
      vectorKbFolderIds =
        promptDetails.vector_kb_folder_ids?.map((id: any) => id.toString()) ||
        [];
      vectorKbDataSourceIds =
        promptDetails.vector_kb_data_source_ids?.map((id: any) =>
          id.toString(),
        ) || [];

      // Determine kbType from existing data
      if (promptDetails.vector_kb_enabled) {
        kbType = "advanced";
      } else if (promptDetails.knowledgebase?.length > 0) {
        kbType = "basic";
      } else {
        kbType = "none";
      }
    } catch (error) {
      promptDialog?.close();
      addToast({
        message:
          error instanceof Error ? error.message : t("common.unexpected.error"),
        type: "error",
      });
    } finally {
      isLoading = false;
    }
  }

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
        knowledgebase: selectedKnowledgeBases.map((inst) => inst._id),
        // Vector KB fields
        vector_kb_enabled: vectorKbEnabled,
        vector_kb_scope: vectorKbEnabled ? vectorKbScope : null,
        vector_kb_folder_ids:
          vectorKbEnabled && vectorKbScope === VectorKBScope.Folder
            ? vectorKbFolderIds
            : [],
        vector_kb_data_source_ids:
          vectorKbEnabled && vectorKbScope === VectorKBScope.DataSource
            ? vectorKbDataSourceIds
            : [],
        ...(selectedCategory && { category: selectedCategory._id }),
        ...(selectedGroup && { group: selectedGroup._id }),
        ...(selectedEditPromptId && { _id: selectedEditPromptId }),
      };

      let httpMethod = "PUT";
      if (dialogMode == "clone") {
        httpMethod = "POST";
      }
      const response = await fetch(apiEndPointPrompt, {
        method: httpMethod,
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
      addToast({
        message: data.message,
        type: "success",
      });

      posthogClientCapture($tenant, EventName.AiboxAssistantSaved, {
        page_name: ScreenName.EditPromptDialog,
        use_case: promptTitle || "-",
      });

      setTimeout(() => {
        navigate(
          `${window.location.href.split("?")[0]}?promptId=${selectedEditPromptId}`,
        );
      }, 0);
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

  function cancelEdit() {
    promptDialog?.close();
    promptTitle = "";
    promptText = "<p></p>";
    initHtml = "<p></p>";
    selectedKnowledgeBases = [];
    selectedEditPromptId = null;
    kbType = "none";
    vectorKbEnabled = false;
    vectorKbScope = VectorKBScope.All;
    vectorKbFolderIds = [];
    vectorKbDataSourceIds = [];
  }

  function handleKeyDown(event: any) {
    if (event.key === "Enter") {
      event.preventDefault();
    }
  }

  $effect(() => {
    if (selectedCategory && selectedCategory._id !== previousCategoryId) {
      selectedGroup = null;
      previousCategoryId = selectedCategory._id;
    }
  });

  // Sync kbType with form data
  $effect(() => {
    if (kbType === "none") {
      selectedKnowledgeBases = [];
      vectorKbEnabled = false;
    } else if (kbType === "basic") {
      vectorKbEnabled = false;
    } else if (kbType === "advanced") {
      selectedKnowledgeBases = [];
      vectorKbEnabled = true;
    }
  });

  let isFormValid = $derived(
    promptTitle?.trim() !== "" &&
      !isHtmlContentEmpty(promptText) &&
      selectedCategory !== undefined &&
      selectedGroup !== undefined,
  );

  $effect(() => {
    if (selectedEditPromptId) {
      getPromptDetail(selectedEditPromptId);
    }
  });
</script>

<dialog class="modal" bind:this={promptDialog}>
  <div class="modal-box w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">
    <!-- Header -->
    <div class="flex justify-between items-start pb-4 border-b border-base-300">
      <div>
        <h3 class="text-xl font-bold">{t("assistant-dialog.title.edit")}</h3>
        <p class="text-sm text-base-content/60 mt-1">
          {t("assistant-dialog.subtitle")}
        </p>
      </div>
      <button class="btn btn-sm btn-circle btn-ghost" onclick={cancelEdit}>
        {@html svgIcons.closeMenu}
      </button>
    </div>

    <LoadingSpinner {isLoading} />

    <form class="pt-6 space-y-6">
      <!-- Section 1: General Configuration -->
      <section>
        <div class="flex items-center gap-2 mb-4">
          <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {@html svgIcons.settings}
          </div>
          <h4 class="font-semibold text-lg">{t("assistant-dialog.section.general")}</h4>
        </div>

        <!-- Title + Category + Use Case row -->
        <div class="grid grid-cols-1 gap-4 mb-4">
          <div>
            <p class="text-sm font-medium mb-2">
              {t("prompt-library.add.prompts.title")}<span class="text-error">*</span>
            </p>
            <input
              type="text"
              bind:value={promptTitle}
              placeholder="e.g. HR Chatbot"
              class="input input-bordered w-full"
              onkeydown={handleKeyDown}
              bind:this={titleInput}
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p class="text-sm font-medium mb-2">
              {t("prompt-library.add.prompts.category")}<span class="text-error">*</span>
            </p>
            <SingleInput
              title=""
              placeholder={t("assistant-dialog.select-category")}
              items={categories}
              bind:selectedItem={selectedCategory}
              displayTop={false}
            />
          </div>

          <div>
            <p class="text-sm font-medium mb-2">
              {t("prompt-library.add.prompts.group")}<span class="text-error">*</span>
            </p>
            {#if selectedCategory}
              <SingleInput
                title=""
                placeholder={t("assistant-dialog.select-usecase")}
                items={selectedCategory.groups}
                bind:selectedItem={selectedGroup}
                displayTop={false}
              />
            {:else}
              <select class="select select-bordered w-full select-disabled" disabled>
                <option>{t("assistant-dialog.select-category-first")}</option>
              </select>
            {/if}
          </div>
        </div>

        <!-- Instructions -->
        <div class="mb-4 relative">
          <p class="text-sm font-medium mb-2">
            {t("prompt-library.add.prompts.instructions")}<span class="text-error">*</span>
          </p>
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
            <RefinementButton
              promptText={promptDetails?.prompt || ""}
              {selectedModel}
              bind:isLoading
              disabled={isHtmlContentEmpty(promptText)}
              onResultReady={(output: string) => {
                promptText = normalizeTextToHtml(output);
                initHtml = normalizeTextToHtml(output);
              }}
            />
          {/key}
        </div>

        <!-- Predefined Input -->
        <div>
          <p class="text-sm font-medium mb-2">{t("prompt-library.add.prompts.predefined-input")}</p>
          <textarea
            bind:value={promptPredefinedInput}
            placeholder={t("assistant-dialog.predefined-input.placeholder")}
            class="textarea textarea-bordered w-full min-h-20"
          ></textarea>
        </div>
      </section>

      <div class="divider my-2"></div>

      <!-- Section 2: Knowledge Base -->
      <section>
        <div class="flex items-center gap-2 mb-4">
          <div class="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
            {@html svgIcons.document}
          </div>
          <h4 class="font-semibold text-lg">{t("assistant-dialog.section.kb")}</h4>
        </div>

        <!-- KB Type Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <KBTypeCard
            type="none"
            title={t("assistant-dialog.kb.none.title")}
            description={t("assistant-dialog.kb.none.desc")}
            bind:selected={kbType}
          />
          <KBTypeCard
            type="basic"
            title={t("assistant-dialog.kb.basic.title")}
            description={t("assistant-dialog.kb.basic.desc")}
            bind:selected={kbType}
          />
          {#if tenantVectorKbEnabled}
            <KBTypeCard
              type="advanced"
              title={t("assistant-dialog.kb.advanced.title")}
              description={t("assistant-dialog.kb.advanced.desc")}
              bind:selected={kbType}
            />
          {/if}
        </div>

        <!-- Conditional: Basic KB selector -->
        {#if kbType === "basic"}
          <div class="bg-base-200 rounded-lg p-4">
            <p class="text-sm font-medium mb-2">{t("assistant-dialog.kb.select-source")}</p>
            <MultiInput
              title=""
              placeholder={t("assistant-dialog.kb.search-placeholder")}
              items={knowledgeBases}
              bind:selectedItems={selectedKnowledgeBases}
            />
          </div>
        {/if}

        <!-- Conditional: Advanced Vector KB -->
        {#if kbType === "advanced"}
          <div class="bg-base-200 rounded-lg p-4">
            <VectorKBScopeSelector
              tenantId={$tenant?._id?.toString() ?? ""}
              bind:vectorKbEnabled
              bind:selectedScope={vectorKbScope}
              bind:selectedFolderIds={vectorKbFolderIds}
              bind:selectedDataSourceIds={vectorKbDataSourceIds}
            />
          </div>
        {/if}
      </section>

      <div class="divider my-2"></div>

      <!-- Section 3: AI Configuration -->
      <section>
        <div class="flex items-center gap-2 mb-4">
          <div class="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
            {@html svgIcons.aitool}
          </div>
          <h4 class="font-semibold text-lg">{t("assistant-dialog.section.ai")}</h4>
        </div>

        <!-- 2x2 Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ModelInput
            bind:selectedModel
            onValueChange={(_value: any) => {
              selectedPromptTool = PromptToolOption.None;
            }}
          />

          {#if Array.isArray(promptTools) && promptTools.length > 0}
            <Dropdown
              label={t("prompt-execution.prompt-tool")}
              placeholder={t("prompt-execution.prompt-tool.placeholder")}
              options={[
                {
                  title: t("prompt-execution.prompt-tool.placeholder"),
                  value: PromptToolOption.None,
                },
                ...promptTools.map((item: Option) => ({
                  title: item.title,
                  value: item.value,
                })),
              ]}
              bind:value={selectedPromptTool}
            />
          {:else}
            <div></div>
          {/if}

          {#if selectedModel.includes(PromptModel.OpenAIGpt5)}
            <Dropdown
              label={t("prompt-execution.reasoning-level")}
              placeholder={t("prompt-execution.reasoning-level.placeholder")}
              options={[
                { title: t("prompt-execution.reasoning-effort.level-none"), value: ReasoningEffortOption.None },
                { title: t("prompt-execution.reasoning-effort.level-low"), value: ReasoningEffortOption.Low },
                { title: t("prompt-execution.reasoning-effort.level-medium"), value: ReasoningEffortOption.Medium },
                { title: t("prompt-execution.reasoning-effort.level-high"), value: ReasoningEffortOption.High },
              ]}
              bind:value={selectedReasoningLevel}
            />

            <Dropdown
              label={t("prompt-execution.text-verbosity")}
              placeholder={t("prompt-execution.text-verbosity.placeholder")}
              options={[
                { title: t("prompt-execution.verbosity.level-low"), value: TextVerbosityOption.Low },
                { title: t("prompt-execution.verbosity.level-medium"), value: TextVerbosityOption.Medium },
                { title: t("prompt-execution.verbosity.level-high"), value: TextVerbosityOption.High },
              ]}
              bind:value={selectedTextVerbosity}
            />
          {/if}
        </div>
      </section>
    </form>

    <!-- Footer -->
    {#if isEditable}
      <div class="flex justify-end gap-2 pt-6 mt-6 border-t border-base-300">
        <button class="btn btn-outline" onclick={preventDefault(cancelEdit)}>
          {t("common.cancel")}
        </button>
        <button
          class="btn btn-primary"
          onclick={preventDefault(savePrompt)}
          disabled={!isFormValid || isSaving}
        >
          {#if isSaving}
            <span class="loading loading-spinner loading-sm"></span>
          {/if}
          {t("assistant-dialog.save-changes")}
        </button>
      </div>
    {/if}
  </div>
  <form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>

<style>
  section :global(svg) {
    width: 18px;
    height: 18px;
  }
</style>
