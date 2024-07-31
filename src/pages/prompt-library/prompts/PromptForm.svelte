<script lang="ts">
  import SingleInput from "./SingleInput.svelte";
  import type { CreatePromptParams } from "$pages/api/prompts.json";

  import { onMount } from "svelte";

  let categories: {
    title: string;
    _id: string;
    groups: { title: string; _id: string }[];
  }[] = [];
  let selectedCategory = "";
  let selectedCategoryId: string;

  let selectedGroup = "";
  let selectedGroupId: string;

  function handleUpdateCategory(title: string) {
    selectedGroup = "";
    selectedGroupId = "";
    const category = categories.find((n) => n.title === title);
    if (category) {
      selectedCategoryId = category._id;
    }
  }

  onMount(async function () {
    const response = await fetch("/api/categories.json", { method: "GET" });
    const data = await response.json();
    if (data) {
      categories = data;
    }
  });

  let promptTitle = "",
    promptText = "";

  let instructions = ["Instructions 1", "Instructions 2", "Instructions 3"];
  let selectedInstruction = "";

  let kbs = ["KB 1", "KB 2", "KB 3"];
  let selectedKb = "";

  async function savePrompt() {
    const newPrompt: CreatePromptParams = {
      tenant_id: "66aa2169d40d0b194e280142", // AI now AG
      creator_id: "669e044a6e55bbb8fe31a868", // admin@aibox.ch
      title: promptTitle,
      category: selectedCategoryId,
      group: selectedGroupId,
      prompt: promptText,
      instructions: selectedInstruction,
      documents: [selectedKb],
    };

    console.log("creating new prompt", newPrompt);

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

<div class="container mx-auto p-4">
  <div class="w-full min-w-xs">
    <h1 class="text-4xl font-medium pb-6">Add Prompt</h1>
    <form class="rounded px-6 pt-6 mb-4 space-y-6">
      <div class="grid grid-cols-1 gap-4 justify-center">
        <div>
          <p class="mb-2">Title</p>
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
          title="Category"
          placeholder="e.g. Editing"
          items={categories.map((n) => n.title)}
          bind:selectedItem={selectedCategory}
          onUpdate={handleUpdateCategory}
        />

        {#if selectedCategory}
          <SingleInput
            title="Group"
            placeholder="e.g. Headlines"
            items={groups}
            bind:selectedItem={selectedGroup}
          />
        {/if}
      </div>

      <div class="mb-4">
        <p class="mb-2">Prompt</p>
        <textarea
          bind:value={promptText}
          placeholder="e.g. Create three headlines..."
          class="input input-bordered min-w-xs shadow appearance-none min-h-32 w-full py-2 px-3"
        />
      </div>

      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 justify-center"
      >
        <SingleInput
          title="Instruction"
          placeholder="e.g. Instruction 1"
          items={instructions}
          bind:selectedItem={selectedInstruction}
          onUpdate={handleUpdateInstruction}
        />

        <SingleInput
          title="Documents"
          placeholder="e.g. KB 1"
          items={kbs}
          bind:selectedItem={selectedKb}
          onUpdate={handleUpdateKB}
        />
      </div>

      <div class="flex items-center justify-between">
        <button
          class="btn btn-active btn-primary py-4 px-8 font-normal"
          on:click|preventDefault={savePrompt}
        >
          Save Prompt
        </button>
        <button class="btn btn-active btn-ghost py-4 px-8 font-normal">
          Try It Out
        </button>
      </div>
    </form>
  </div>
</div>
