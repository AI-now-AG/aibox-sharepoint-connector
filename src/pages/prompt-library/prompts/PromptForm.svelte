<script lang="ts">
  import SingleInput from "./SingleInput.svelte";
  import type { CreatePromptParams } from "$pages/api/prompts.json";
  import { useTranslations } from "$i18n/utils";

  import { onMount } from "svelte";
  import MultiInput from "./MultiInput.svelte";
  export let preferredLocale;
  const t = useTranslations(preferredLocale);

  type Group = { title: string; _id: string }; // TODO: Get the type from the API endpoint
  type Category = {
    title: string;
    _id: string;
    groups: Group[];
  };

  type Instruction = {
    title: string;
    _id: string;
  };

  type KnowledgeBase = {
    title: string;
    _id: string;
  };

  let categories: Category[] = [];
  let selectedCategory: Category;
  let selectedGroup: Group;

  let instructions: Instruction[] = [];
  let selectedInstructions: Instruction[] = [];

  let knowledgeBases: KnowledgeBase[] = [];
  let selectedKnowledgeBases: KnowledgeBase[] = [];

  let promptTitle = "";
  let promptText = "";

  onMount(async function () {
    const response = await fetch("/api/categories.json", { method: "GET" });
    const data = await response.json();
    if (data) {
      categories = data;
    }
    
    const instructionResponse = await fetch("/api/instructions.json", {
      method: "GET",
    });
    const instructionData = await instructionResponse.json();
    if (instructionData) {
      instructions = instructionData;
    }
    
    const knowledgeBaseResponse = await fetch("/api/knowledge-base.json", {
      method: "GET",
    });
    const knowledgeBaseData = await knowledgeBaseResponse.json();
    if (knowledgeBaseData) {
      knowledgeBases = knowledgeBaseData;
    }
  });

  async function savePrompt() {
    const newPrompt: CreatePromptParams = {
      title: promptTitle,
      category: selectedCategory._id,
      group: selectedGroup._id,
      prompt: promptText,
      instructions: selectedInstructions.map((inst) => inst._id),
      knowledgebase: selectedKnowledgeBases.map((inst) => inst._id),
    };

    const response = await fetch("/api/prompts.json", {
      method: "POST",
      body: JSON.stringify(newPrompt),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    alert(data.message);
  }
</script>

<div class="container max-w-5xl p-6 mx-auto p-4">
  <div class="w-full min-w-xs pt-2 lg:pt-6">
    <h1 class="pt-2 text-4xl font-bold pb-6">
      {t("prompt-library.prompts.add")}
    </h1>
    <form class="rounded pt-6 mb-4 space-y-6">
      <div class="grid grid-cols-1 gap-4 justify-center">
        <div>
          <p class="mb-2">{t("prompt-library.add.prompts.title")}</p>
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
          title={t("prompt-library.add.prompts.category")}
          placeholder="e.g. Editing"
          items={categories}
          bind:selectedItem={selectedCategory}
        />

        {#if selectedCategory}
          <SingleInput
            title={t("prompt-library.add.prompts.group")}
            placeholder="e.g. Headlines"
            items={selectedCategory.groups}
            bind:selectedItem={selectedGroup}
          />
        {/if}
      </div>

      <div class="mb-4">
        <p class="mb-2">{t("prompt-library.add.prompts.prompt")}</p>
        <textarea
          bind:value={promptText}
          placeholder="e.g. Create three headlines..."
          class="input input-bordered min-w-xs shadow appearance-none min-h-32 w-full py-2 px-3"
        />
      </div>

      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 justify-center"
      >
        <MultiInput
          title={t("prompt-library.add.prompts.instructions")}
          placeholder="e.g. Instruction"
          items={instructions}
          bind:selectedItems={selectedInstructions}
        />

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

      <div class="flex items-center justify-between">
        <button
          class="btn btn-active btn-primary py-4 px-8 font-normal"
          on:click|preventDefault={savePrompt}
        >
          {t("prompt-library.add.prompts.save")}
        </button>
        <button class="btn btn-active btn-ghost py-4 px-8 font-normal">
          Try It Out
        </button>
      </div>
    </form>
  </div>
</div>
