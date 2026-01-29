<script lang="ts">
  import Loading from "$components/Loading.svelte";
  import { useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";
  import { preventDefault, toHeadline } from "$utils/common";
  import { actions } from "astro:actions";

  const t = useTranslations();

  interface CitationInstruction {
    en: string;
    de: string;
  }

  interface Props {
    configurationId: string;
    instructions: Array<any>;
    citationInstruction?: CitationInstruction;
  }

  let { configurationId, instructions: formData, citationInstruction }: Props = $props();

  // Initialize citation instruction - empty if not in DB
  // Backend has the default fallback, so empty here means "use backend default"
  let citationInstructionData: CitationInstruction = $state(
    citationInstruction ?? { en: '', de: '' }
  );

  let selectedLang: string = $state("en");
  let loading: boolean = $state(false);

  function switchLanguage(langEvent: Event) {
    const target = langEvent.target as HTMLSelectElement;
    selectedLang = target.value;
  }

  async function saveInstructions() {
    try {
      loading = true;
      const { error } = await actions.configurations.update({
        defaultInstructions: formData,
        citationInstruction: citationInstructionData,
        _id: configurationId,
      });

      if (!error) {
        addToast({
          message: t("instructions.update-instructions-setting-successfull"),
          type: "success",
        });
      } else {
        addToast({
          message:
            t("instructions.update-instructions-setting-failed") +
            JSON.stringify(error),
          type: "error",
        });
      }
    } catch (error) {
      addToast({
        message: JSON.stringify(
          t("instructions.update-instructions-setting-failed") + error,
        ),
        type: "error",
      });
    } finally {
      loading = false;
    }
  }
</script>

<div
  class="sticky top-0 right-0 z-50 p-4 bg-base-100 flex justify-between items-center shadow-lg"
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
      <option value="en">{t("tenant.english-language")}</option>
      <option value="de">{t("tenant.german-language")}</option>
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
      <div
        class={`card-body ${providerData.provider === "default" ? "bg-yellow-50" : "bg-base-100"} rounded-xl`}
      >
        <h1 class="card-title capitalize text-2xl font-extrabold text-primary">
          {toHeadline(providerData.provider)}
        </h1>
        <div
          class="flex items-center gap-4 bg-base-200 p-4 rounded-xl border border-base-300 transition-colors hover:bg-base-300"
        >
          <label
            class="label w-1/3"
            for={`default-instruction-${providerData.provider}-${selectedLang}`}
          >
            <span class="label-text text-lg font-semibold">
              {t("instructions.default-instruction")} ({selectedLang})
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

        {#if providerData.models}
          {#each Object.entries(providerData.models) as [modelName, modelData]}
            {@const typedModelData = modelData as {
              instruction: Record<string, string>;
            }}
            <div class="divider"></div>

            <h3 class="font-bold text-lg text-secondary flex items-center">
              {modelName}
              <span class="text-xs text-gray-400 font-normal ml-2">
                ({t(
                  "instructions.leave-model-instruction-empty-to-use-default-instruction",
                )})
              </span>
            </h3>

            <div class="flex items-center gap-4">
              <label
                class="label w-1/3 flex-wrap"
                for={`model-instruction-${providerData.provider}-${modelName}-${selectedLang}`}
              >
                <span class="label-text font-semibold">
                  {t("instructions.model-instruction")} ({selectedLang})
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

  <!-- Citation Instruction for RAG -->
  <div class="card shadow-lg my-6">
    <div class="card-body bg-green-50 rounded-xl">
      <h1 class="card-title text-2xl font-extrabold text-primary">
        {t("instructions.citation-instruction-title")}
      </h1>
      <p class="text-sm text-base-content/70 mb-2">
        {t("instructions.citation-instruction-description")}
      </p>
      <div
        class="flex items-start gap-4 bg-base-200 p-4 rounded-xl border border-base-300 transition-colors hover:bg-base-300"
      >
        <label
          class="label w-1/3"
          for={`citation-instruction-${selectedLang}`}
        >
          <span class="label-text text-lg font-semibold">
            {t("instructions.citation-instruction")} ({selectedLang})
          </span>
        </label>
        <div class="w-2/3">
          <textarea
            id={`citation-instruction-${selectedLang}`}
            class="textarea textarea-bordered h-40 w-full"
            placeholder={t("instructions.citation-instruction-placeholder")}
            bind:value={citationInstructionData[selectedLang as 'en' | 'de']}
          ></textarea>
          <p class="text-xs text-base-content/50 mt-1">
            {t("instructions.citation-instruction-empty-hint")}
          </p>
        </div>
      </div>
    </div>
  </div>
</form>

<Loading show={loading} />
