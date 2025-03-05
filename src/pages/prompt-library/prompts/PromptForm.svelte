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

  const t = useTranslations();

  type Group = { title: string; _id: string };
  type Category = {
    title: string;
    _id: string;
    groups: Group[];
  };
  type Model = {
    _id: string;
    title: string;
  };
  type KnowledgeBase = {
    title: string;
    _id: string;
  };

  let categories: Category[] = $state([]);
  let selectedCategory: Category | undefined = $state();
  let selectedGroup: Group | undefined = $state();

  let previousCategoryId: string | null = $state(null);
  $effect(() => {
    if (selectedCategory && selectedCategory._id !== previousCategoryId) {
      selectedGroup = undefined;
      previousCategoryId = selectedCategory._id;
    }
  });

  let models: Model[] = $state([]);
  let selectedModel: Model | undefined = $state();

  let knowledgeBases: KnowledgeBase[] = $state([]);
  let selectedKnowledgeBases: KnowledgeBase[] = $state([]);

  let promptTitle = $state("");
  let promptText = $state("");

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

  onMount(async function () {
    const response = await fetch("/api/categories.json", { method: "GET" });
    const data = await response.json();
    if (data) {
      categories = data;
    }
    await fetchInstructionAndKB();
    if (prompt) {
      promptTitle = prompt.title;
      promptText = prompt.prompt;

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
        model: selectedModel ? selectedModel._id : null,
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
    <form class="rounded pt-6 mb-4 space-y-6">
      <div class="grid grid-cols-1 gap-4 justify-center">
        <div>
          <p class="mb-2">{t("prompt-library.add.prompts.title")}*</p>
          <input
            type="text"
            bind:value={promptTitle}
            placeholder="e.g. Create three sports headlines"
            class="input input-bordered w-full min-w-xs"
            onkeydown={handleKeyDown}
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

      <div class="mb-4">
        <p class="mb-2">{t("prompt-library.add.prompts.instructions")}*</p>
        <textarea
          bind:value={promptText}
          placeholder="e.g. Create three headlines..."
          class="input input-bordered min-w-xs shadow appearance-none min-h-32 w-full py-2 px-3"
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
        <ModelInput bind:models bind:selectedModel />
      </div>

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
