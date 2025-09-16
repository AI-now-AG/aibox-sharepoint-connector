<script lang="ts">
  import { preventDefault } from "$utils/common";
  import { onMount } from "svelte";

  interface Props {
    instructions: Array<any>;
  }

  let { instructions }: Props = $props();

  let currentLang: string = $state("en");

  let formData = instructions;

  // Handle language change event
  function handleLangChange(event: Event) {
    const customEvent = event as CustomEvent<{ lang: string }>;
    if (customEvent.detail && customEvent.detail.lang) {
      currentLang = customEvent.detail.lang;
    }
  }

  // Handle saving data to the backend
  async function saveInstructions() {
    try {
      const response = await fetch("/api/instructions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultInstructions: formData }),
      });
      if (response.ok) {
        alert("Instructions saved successfully!");
      } else {
        alert("Failed to save instructions.");
      }
    } catch (error) {
      console.error("Error saving instructions:", error);
      alert("An error occurred.");
    }
  }

  // This part connects the language selector to this component
  onMount(() => {
    window.addEventListener("langChange", handleLangChange);
  });
</script>

<form onsubmit={preventDefault(saveInstructions)}>
  {#each formData as providerData}
    <div class="card bg-base-100 shadow-xl my-4">
      <div class="card-body">
        <h2 class="card-title capitalize">
          {providerData.provider} Instructions
        </h2>

        <div class="form-control">
          <label
            class="label"
            for={`default-instruction-${providerData.provider}-${currentLang}`}
          >
            <span class="label-text">Default Instruction ({currentLang})</span>
          </label>
          <textarea
            id={`default-instruction-${providerData.provider}-${currentLang}`}
            class="textarea textarea-bordered h-24"
            bind:value={providerData.instruction[currentLang]}
          ></textarea>
        </div>

        {#if providerData.model}
          {#each Object.entries(providerData.model) as [modelName, modelData]}
            {@const typedModelData = modelData as {
              instruction: Record<string, string>;
            }}
            <div class="divider"></div>
            <h3 class="font-bold text-lg">{modelName}</h3>
            <div class="form-control">
              <label
                class="label"
                for={`model-instruction-${providerData.provider}-${modelName}-${currentLang}`}
              >
                <span class="label-text">Model Instruction ({currentLang})</span
                >
              </label>
              <textarea
                id={`model-instruction-${providerData.provider}-${modelName}-${currentLang}`}
                class="textarea textarea-bordered h-24"
                bind:value={typedModelData.instruction[currentLang]}
              ></textarea>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  {/each}

  <div class="mt-8 flex justify-end">
    <button type="submit" class="btn btn-primary">Save Instructions</button>
  </div>
</form>
