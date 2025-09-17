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

<div
  class="sticky top-0 right-0 z-50 p-4 bg-white flex justify-between items-center shadow-lg"
>
  <div class="form-control">
    <label class="label mb-2" for="language-select">
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
  <button
    type="submit"
    class="btn btn-primary"
    onclick={preventDefault(saveInstructions)}
  >
    {t("common.save")}
  </button>
</div>

<form onsubmit={preventDefault(saveInstructions)}>
  {#each formData as providerData}
    <div class="card shadow-lg my-6">
      <div class="card-body">
        <h1 class="card-title capitalize text-2xl font-extrabold text-primary">
          {providerData.provider}
        </h1>
        <span class="label-text">
          (Leave Model Instruction blank to use Default Instruction)
        </span>
        <div
          class="flex items-center gap-4 bg-base-200 p-4 rounded-xl border border-base-300 transition-colors hover:bg-base-300"
        >
          <label
            class="label w-1/3"
            for={`default-instruction-${providerData.provider}-${selectedLang}`}
          >
            <span class="label-text text-lg font-semibold">
              Default Instruction ({selectedLang})
            </span>
          </label>
          <div class="w-2/3">
            <textarea
              id={`default-instruction-${providerData.provider}-${selectedLang}`}
              class="textarea textarea-bordered h-24 w-full"
              bind:value={providerData.instruction[selectedLang]}
            ></textarea>
          </div>
        </div>

        {#if providerData.model}
          {#each Object.entries(providerData.model) as [modelName, modelData]}
            {@const typedModelData = modelData as {
              instruction: Record<string, string>;
            }}
            <div class="divider"></div>
            <h3 class="font-bold text-lg text-secondary">{modelName}</h3>
            <div class="flex items-center gap-4">
              <label
                class="label w-1/3"
                for={`model-instruction-${providerData.provider}-${modelName}-${selectedLang}`}
              >
                <span class="label-text">
                  Model Instruction ({selectedLang})
                </span>
              </label>
              <div class="w-2/3">
                <textarea
                  id={`model-instruction-${providerData.provider}-${modelName}-${selectedLang}`}
                  class="textarea textarea-bordered h-24 w-full"
                  bind:value={typedModelData.instruction[selectedLang]}
                ></textarea>
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  {/each}
</form>
