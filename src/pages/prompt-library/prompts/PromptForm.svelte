<script lang="ts">
  import type { CreatePromptParams } from "$pages/api/prompts/index.json";
  import { useTranslations } from "$i18n/utils";
  import { svgIcons } from "$assets/icons";
  import { onMount } from "svelte";
  import SingleInput from "$pages/prompt-library/prompts/SingleInput.svelte";
  import MultiInput from "$pages/prompt-library/prompts/MultiInput.svelte";
  import ModelInput from "$pages/prompt-library/prompts/ModelInput.svelte";
  import { addToast } from "$stores/toast";
  import { preventDefault } from "$utils/common";
  import TextEditor from "$components/form/TextEditor.svelte";
  import Dropdown, { type Option } from "$components/form/Dropdown.svelte";
  import { PromptModel } from "$types/PromptModel";
  import {
    PromptToolOption,
    ReasoningEffortOption,
    TextVerbosityOption,
  } from "$types/AIProvider";
  import {
    getPromptTools,
    getProviderFromPromptModel,
    useProviderInfo,
  } from "$shared/AIProvider";
  import { tenant } from "$stores";
  import { normalizeTextToHtml } from "$utils/textFormatting";
  import { actions } from "astro:actions";
  import Loading from "$components/Loading.svelte";

  const t = useTranslations();

  type Group = { title: string; _id: string };
  type Category = {
    title: string;
    _id: string;
    groups: Group[];
  };

  type KnowledgeBase = {
    title: string;
    _id: string;
  };

  let categories: Category[] = $state([]);
  let selectedCategory: Category | undefined = $state();
  let selectedGroup: Group | undefined = $state();

  let knowledgeBases: KnowledgeBase[] = $state([]);
  let selectedKnowledgeBases: KnowledgeBase[] = $state([]);

  let selectedModel: string = $state("");
  let selectedPromptTool: any = $state("");

  let selectedReasoningLevel: any = $state("low");
  let selectedTextVerbosity: any = $state("low");

  let previousCategoryId: string | null = $state(null);
  $effect(() => {
    if (selectedCategory && selectedCategory._id !== previousCategoryId) {
      selectedGroup = undefined;
      previousCategoryId = selectedCategory._id;
    }
  });

  let promptTitle = $state("");
  let initHtml = $state("");
  let promptText = $state("");
  let promptPredefinedInput = $state("");

  let titleInput: HTMLInputElement | undefined = $state();

  interface Props {
    promptId?: string | undefined;
    prompt?: any | undefined;
    isEditable?: boolean;
  }

  let {
    promptId = undefined,
    prompt = undefined,
    isEditable = false,
  }: Props = $props();

  let isSaving = $state(false);
  let isLoading = $state(false);

  const providerInfo = useProviderInfo($tenant);
  let promptTools: Array<any> = $derived(
    getPromptTools(
      (selectedModel == PromptModel.Default
        ? providerInfo?.defaultProviderPromptModelName == PromptModel.OpenAI
          ? PromptModel.OpenAIWithTools
          : providerInfo?.defaultProviderPromptModelName
        : selectedModel) as PromptModel,
    ) ?? [],
  );

  onMount(async function () {
    const response = await fetch("/api/categories.json", { method: "GET" });
    const data = await response.json();
    if (data) {
      categories = data;
    }
    await fetchInstructionAndKB();
    if (prompt) {
      promptTitle = prompt.title;
      initHtml = normalizeTextToHtml(prompt.prompt);
      promptText = normalizeTextToHtml(prompt.prompt);
      promptPredefinedInput = prompt.predefined_input;

      const category = categories.find(
        (e) => e._id == prompt.category.toString(),
      );
      if (category) {
        selectedCategory = category;
        previousCategoryId = category._id;
      }

      const group = category?.groups.find(
        (e) => e._id == prompt.group.toString(),
      );
      if (group) {
        selectedGroup = group;
      }
    }
  });

  async function fetchInstructionAndKB() {
    const knowledgeBaseResponse = await fetch("/api/knowledge-base.json", {
      method: "GET",
    });
    const knowledgeBaseData =
      (await knowledgeBaseResponse.json()) as KnowledgeBase[];
    if (knowledgeBaseData) {
      if (prompt) {
        prompt.knowledgebase?.forEach((kbObj: any) => {
          const kb = knowledgeBaseData.find((e) => e._id == kbObj.toString());
          if (kb) {
            selectedKnowledgeBases.push(kb);
          }
        });
      }
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
        knowledgebase: selectedKnowledgeBases.map((inst) => inst._id),
        ...(selectedCategory && { category: selectedCategory._id }),
        ...(selectedGroup && { group: selectedGroup._id }),
        ...(promptId && { _id: promptId }),
      };

      const response = await fetch("/api/prompts/index.json", {
        method: prompt ? "PUT" : "POST",
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
      window.history.back();
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

  function handleKeyDown(event: any) {
    if (event.key === "Enter") {
      event.preventDefault();
    }
  }

  async function improvePromptInstruction() {
    try {
      isLoading = true;
      const selectedProvider = getProviderFromPromptModel(
        selectedModel as PromptModel,
      );
      const { data, error } = await actions.prompt.improvePrompt({
        provider: selectedProvider,
        instruction: promptText,
      });
      if (error) {
        console.error("improvePromptInstruction error", error);
        addToast({ type: "error", message: error?.toString() });
      } else {
        initHtml = normalizeTextToHtml(data);
        promptText = normalizeTextToHtml(data);

        addToast({
          type: "success",
          message: t(
            "prompt-library.add.prompts.instructions.toast-completed-improvement",
          ),
        });
      }
    } catch (error: any) {
      addToast({ type: "error", message: error?.toString() });
      console.error("improvePromptInstruction exception", error);
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="container max-w-5xl mx-auto p-4">
  <div class="w-full min-w-xs pt-2 lg:pt-6">
    <div class="flex items-center pt-2 pb-6">
      <button class="mr-4" onclick={() => window.history.back()}>
        {@html svgIcons.back}
      </button>
      <h1 class="text-4xl font-bold">
        {#if prompt}
          {t("prompt-library.prompts.edit")}
        {:else}
          {t("prompt-library.prompts.add")}
        {/if}
      </h1>
    </div>
    <form class="rounded-sm pt-6 mb-4 space-y-6">
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

      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 justify-center"
      >
        <SingleInput
          title={`${t("prompt-library.add.prompts.category")}*`}
          placeholder="e.g. Editing"
          items={categories}
          bind:selectedItem={selectedCategory}
        />

        {#if selectedCategory}
          <SingleInput
            title={`${t("prompt-library.add.prompts.group")}*`}
            placeholder="e.g. Headlines"
            items={selectedCategory.groups}
            bind:selectedItem={selectedGroup}
          />
        {/if}
      </div>

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
            cssClass=" mt-3"
          />
          <button
            class="btn btn-sm absolute top-[-5] right-0 flex"
            onclick={preventDefault(improvePromptInstruction)}
          >
            <span class="">{@html svgIcons.aitool}</span>
            <span class="text-sm font-bold"
              >{t(
                "prompt-library.add.prompts.instructions.improve-instruction",
              )}</span
            >
          </button>
        {/key}
      </div>

      <div class="mb-4">
        <p class="mb-2">{t("prompt-library.add.prompts.predefined-input")}</p>
        <textarea
          bind:value={promptPredefinedInput}
          placeholder=""
          class="input input-bordered min-w-xs shadow-sm appearance-none min-h-32 w-full py-2 px-3"
        ></textarea>
      </div>

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

      {#if isEditable}
        <div class="flex items-center justify-between">
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
  </div>
</div>

<Loading show={isLoading} />
