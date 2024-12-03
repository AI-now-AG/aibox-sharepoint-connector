<script lang="ts">
  import SingleInput from "$pages/prompt-library/prompts/SingleInput.svelte";
  import type { CreatePromptParams } from "$pages/api/prompts/index.json";
  import { useTranslations } from "$i18n/utils";
  import { svgIcons } from "$assets/icons";
  import { onMount } from "svelte";
  import MultiInput from "$pages/prompt-library/prompts/MultiInput.svelte";
  import { addToast } from "$stores/toast";

  const t = useTranslations();

  type Group = { title: string; _id: string }; // TODO: Get the type from the API endpoint
  type Category = {
    title: string;
    _id: string;
    groups: Group[];
  };

  /*type Instruction = {
    title: string;
    _id: string;
  };*/

  type KnowledgeBase = {
    title: string;
    _id: string;
  };

  let categories: Category[] = [];
  let selectedCategory: Category;
  let selectedGroup: Group;

  let previousCategoryId: string | null = null;
  $: if (selectedCategory && selectedCategory._id !== previousCategoryId) {
    selectedGroup = null;
    previousCategoryId = selectedCategory._id;
  }

  //let instructions: Instruction[] = [];
  //let selectedInstructions: Instruction[] = [];

  let knowledgeBases: KnowledgeBase[] = [];
  let selectedKnowledgeBases: KnowledgeBase[] = [];

  let promptTitle = "";
  let promptText = "";

  export let promptId: string | undefined = undefined;
  export let prompt: any | undefined = undefined;
  export let isEditable: boolean = false;

  let isSaving = false;

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
    /*const instructionResponse = await fetch("/api/instructions.json", {
      method: "GET",
    });
    const instructionData = (await instructionResponse.json()) as Instruction[];
    if (instructionData) {
      if (prompt) {
        prompt.instructions?.forEach((instructionObj: any) => {
          const instruction = instructionData.find(
            (e) => e._id == instructionObj.toString(),
          );
          if (instruction) {
            selectedInstructions.push(instruction);
          }
        });
      }
      instructions = instructionData;
    }*/

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

  $: isFormValid =
    promptTitle.trim() !== "" &&
    promptText.trim() !== "" &&
    selectedCategory !== undefined &&
    selectedGroup !== undefined;

  async function savePrompt() {
    if (!isFormValid) return;

    isSaving = true;
    try {
      const newPrompt: CreatePromptParams = {
        title: promptTitle,
        prompt: promptText,
        knowledgebase: selectedKnowledgeBases.map((inst) => inst._id),
        ...(selectedCategory && { category: selectedCategory._id }),
        ...(selectedGroup && { group: selectedGroup._id }),
        ...(promptId && { _id: promptId }),
      };

      const response = await fetch("/api/prompts.json", {
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
</script>

<div class="container max-w-5xl mx-auto p-4">
  <div class="w-full min-w-xs pt-2 lg:pt-6">
    <div class="flex items-center pt-2 pb-6">
      <button class="mr-4" onclick="window.history.back();">
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
        />
      </div>

      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 justify-center"
      >
        <!-- <MultiInput
          title={t("prompt-library.add.prompts.instructions")}
          placeholder="e.g. Instruction"
          items={instructions}
          bind:selectedItems={selectedInstructions}
        /> -->

        <MultiInput
          title={t("prompt-library.add.prompts.knowledge-base")}
          placeholder="e.g. Knowledge base"
          items={knowledgeBases}
          bind:selectedItems={selectedKnowledgeBases}
        />

        <!-- <SingleInput
          title="Documents"
          placeholder="e.g. KB 1"
          items={kbs}
          bind:selectedItem={selectedKb}
          onUpdate={handleUpdateKB}
        /> -->
      </div>

      {#if isEditable}
        <div class="flex items-center justify-between">
          <button
            class={`btn btn-active btn-primary px-8 font-normal ${(!isFormValid || isSaving) && "btn-disabled"}`}
            on:click|preventDefault={savePrompt}
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
