<script lang="ts">
  import { actions } from "astro:actions";
  import { useTranslations } from "$i18n/utils";
  import { addToast } from "$stores/toast";
  import { preventDefault } from "$utils/common";
  import Loading from "$components/Loading.svelte";

  const t = useTranslations();

  interface Props {
    configurationId: string;
    promptRefinementInstruction: string;
    promptKbGenerationInstruction: string;
    selfOnboardingIndustryInstruction: string;
  }

  let {
    configurationId,
    promptRefinementInstruction,
    promptKbGenerationInstruction,
    selfOnboardingIndustryInstruction,
  }: Props = $props();

  let loading: boolean = $state(false);

  async function saveAll() {
    loading = true;
    const { error } = await actions.configurations.update({
      _id: configurationId,
      promptRefinementInstruction,
      promptKbGenerationInstruction,
      selfOnboardingIndustryInstruction,
    });

    if (!error) {
      addToast({
        message: t("global-prompts.save-success"),
        type: "success",
      });
    } else {
      addToast({
        message: t("global-prompts.save-failed") + JSON.stringify(error),
        type: "error",
      });
    }
    loading = false;
  }
</script>

<form onsubmit={preventDefault(saveAll)}>
  <!-- Prompt Refinement -->
  <div class="card shadow-lg my-6">
    <div class="card-body bg-base-100 rounded-xl">
      <h2 class="text-xl font-semibold">
        {t("global-prompts.refinement-title")}
      </h2>
      <p class="text-sm text-base-content/60">
        {t("global-prompts.refinement-description")}
      </p>
      <textarea
        id="global-prompt-refinement"
        class="textarea textarea-bordered h-64 w-full mt-2"
        bind:value={promptRefinementInstruction}
      ></textarea>
    </div>
  </div>

  <!-- Prompt KB Generation -->
  <div class="card shadow-lg my-6">
    <div class="card-body bg-base-100 rounded-xl">
      <h2 class="text-xl font-semibold">
        {t("global-prompts.kb-generation-title")}
      </h2>
      <p class="text-sm text-base-content/60">
        {t("global-prompts.kb-generation-description")}
      </p>
      <textarea
        id="global-prompt-kb-generation"
        class="textarea textarea-bordered h-64 w-full mt-2"
        bind:value={promptKbGenerationInstruction}
      ></textarea>
    </div>
  </div>

  <!-- Self-Onboarding Industry Detection -->
  <div class="card shadow-lg my-6">
    <div class="card-body bg-base-100 rounded-xl">
      <h2 class="text-xl font-semibold">
        {t("global-prompts.self-onboarding-industry-title")}
      </h2>
      <p class="text-sm text-base-content/60">
        {t("global-prompts.self-onboarding-industry-description")}
      </p>
      <textarea
        id="global-prompt-self-onboarding-industry"
        class="textarea textarea-bordered h-64 w-full mt-2"
        bind:value={selfOnboardingIndustryInstruction}
      ></textarea>
    </div>
  </div>

  <div class="text-right">
    <button type="submit" class="btn btn-primary">
      {t("common.save")}
    </button>
  </div>
</form>

<Loading show={loading} />
