<script>
  import MultiInput from "./MultiInput.svelte";
  import SingleInput from "./SingleInput.svelte";

  import { onMount } from "svelte";

  let categoryList;
  let categories = ["Test Writing", "SEO", "Marketing"];
  let activatedCategory = "",
    selectedCategoryId;

  let groups = ["Headlines", "Summarize", "Shorten text", "Police Report"];
  let activatedGroup = "",
    selectedGroupId;

  function handleUpdateCategory(newValue) {
    activatedGroup = "";
    selectedGroupId = "";
    const idx = categoryList.findIndex((n) => n.title === newValue);
    if (idx !== -1) {
      groups = categoryList[idx].group.map((n) => n.title);
      selectedCategoryId = categoryList[idx]._id;
    }
  }

  function handleUpdateGroup(newValue) {
    const idx = categoryList.findIndex((n) => n.title === activatedCategory);
    if (idx !== -1) {
      const groupIdx = categoryList[idx].group.findIndex(
        (n) => n.title === newValue,
      );
      if (groupIdx !== -1) {
        selectedGroupId = categoryList[idx].group[groupIdx]._id;
        console.log(selectedGroupId)
      }
    }
  }

  function handleUpdateInstruction(newValue) {}

  function handleUpdateKB(newValue) {}

  onMount(async function () {
    // TODO: That was a workaround for the demo. This components needs a context
    const response = await fetch("/api/getCategories.json", { method: "GET" });
    const data = await response.json();
    if (data.categories) {
      categoryList = data.categories;
      categories = categoryList.map((n) => n.title);
    }
  });

  let promptTitle = "",
    promptText = "";
  let inputTypes = ["Text", "Image", "File"];
  let selectedInputTypes = [];

  let outputTypes = ["Text"];
  let selectedOutputTypes = [];

  let instructions = ["Instrunctions 1", "Instrunctions 2", "Instrunctions 3"];
  let selectedInstruction = "";

  let kbs = ["KB 1", "KB 2", "KB 3"];
  let selectedKb = "";

  async function savePrompt() {
    alert(promptText);
    const response = await fetch("/api/addPrompt.json", {
      method: "POST",
      body: JSON.stringify({
        title: promptTitle,
        category: selectedCategoryId,
        group: selectedGroupId,
        prompt: promptText,
        inputTypes: selectedInputTypes,
        outputTypes: selectedOutputTypes,
        instruction: selectedInstruction,
        kb: selectedKb,
      }),
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
            placeholder="e.g. Create a three sports headlines"
            class="input input-bordered w-full min-w-xs"
          />
        </div>
      </div>

      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 justify-center"
      >
        <SingleInput
          title="Select Category"
          placeholder="e.g. Editing"
          items={categories}
          bind:selectedItem={activatedCategory}
          onUpdate={handleUpdateCategory}
        />

        <SingleInput
          title="Select Group"
          placeholder="e.g. Headlines"
          items={groups}
          bind:selectedItem={activatedGroup}
          onUpdate={handleUpdateGroup}
        />
      </div>

      <div class="mb-4">
        <p class="mb-2">Prompt Text</p>
        <textarea
          type="text"
          bind:value={promptText}
          placeholder="e.g. Create [insert number of variants] headlines..."
          class="input input-bordered w-full min-w-xs shadow appearance-none min-h-32 w-full py-2 px-3"
        />
      </div>

      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 justify-center"
      >
        <MultiInput
          title="Select Input Type"
          placeholder="e.g. Headline instructions"
          items={inputTypes}
          bind:selectedItems={selectedInputTypes}
        />

        <MultiInput
          title="Select Output Type"
          placeholder="e.g. Headline instructions"
          items={outputTypes}
          bind:selectedItems={selectedOutputTypes}
        />
      </div>

      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 justify-center"
      >
        <SingleInput
          title="Select Instruction"
          placeholder="e.g. Instruction 1"
          items={instructions}
          bind:selectedItem={selectedInstruction}
          onUpdate={handleUpdateInstruction}
        />

        <SingleInput
          title="Select KB"
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
