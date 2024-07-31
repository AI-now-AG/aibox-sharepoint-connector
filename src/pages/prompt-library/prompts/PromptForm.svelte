<script lang="ts">
  import SingleInput from "./SingleInput.svelte";
  import type { CreatePromptParams } from "$pages/api/prompts.json";

  import { onMount } from "svelte";

  type Group = { title: string; _id: string }; // TODO: Get the type from the API endpoint
  type Category = {
    title: string;
    _id: string;
    groups: Group[];
  };

  let categories: Category[] = [];
  let selectedCategory: Category;
  let selectedGroup: Group;

  let promptTitle = "";
  let promptText = "";

  onMount(async function () {
    const response = await fetch("/api/categories.json", { method: "GET" });
    const data = await response.json();
    if (data) {
      categories = data;
    }
  });

  async function savePrompt() {
    const newPrompt: CreatePromptParams = {
      tenant_id: "66aa2169d40d0b194e280142", // AI now AG TODO: Move to endpoint, get data based on token
      creator_id: "669e044a6e55bbb8fe31a868", // admin@aibox.ch TODO: Move to endpoint, get data based on token
      title: promptTitle,
      category: selectedCategory._id,
      group: selectedGroup._id,
      prompt: promptText,
      instructions: "",
      documents: [""],
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
          items={categories}
          bind:selectedItem={selectedCategory}
        />

        {#if selectedCategory}
          <SingleInput
            title="Group"
            placeholder="e.g. Headlines"
            items={selectedCategory.groups}
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

      <!--
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
      -->

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
