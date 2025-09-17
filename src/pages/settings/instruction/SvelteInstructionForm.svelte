<script lang="ts">
  import { useTranslations } from "$i18n/utils";
  import { preventDefault } from "$utils/common";
  import { onMount } from "svelte";

  const t = useTranslations();

  interface Props {
    instructions: Array<any>;
  }

  let { instructions }: Props = $props();

  let selectedLang: string = $state("en");

  let formData = instructions;

  function switchLanguage(langEvent: Event) {
    const target = langEvent.target as HTMLSelectElement;
    selectedLang = target.value;
    console.log("Switching language to", selectedLang);
  }

  // Handle saving data to the backend
  async function saveInstructions() {
    alert("Saving instructions...");
    return;
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

  onMount(() => {});
</script>

<div class="form-control">
  <label class="label" for="language-select">
    <span class="label-text">{t("instructions.select-language")}</span>
  </label>
  <select
    onchange={(event) => switchLanguage(event)}
    value={selectedLang}
    class="select select-bordered w-full max-w-xs"
  >
    <option value="en">English</option>
    <option value="de">German</option>
  </select>
</div>

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
            for={`default-instruction-${providerData.provider}-${selectedLang}`}
          >
            <span class="label-text">Default Instruction ({selectedLang})</span>
          </label>
          <textarea
            id={`default-instruction-${providerData.provider}-${selectedLang}`}
            class="textarea textarea-bordered h-24"
            bind:value={providerData.instruction[selectedLang]}
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
                for={`model-instruction-${providerData.provider}-${modelName}-${selectedLang}`}
              >
                <span class="label-text"
                  >Model Instruction ({selectedLang})</span
                >
              </label>
              <textarea
                id={`model-instruction-${providerData.provider}-${modelName}-${selectedLang}`}
                class="textarea textarea-bordered h-24"
                bind:value={typedModelData.instruction[selectedLang]}
              ></textarea>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  {/each}

  <div class="mt-8 flex justify-end">
    <button type="submit" class="btn btn-primary">{t("common.save")}</button>
  </div>
</form>
