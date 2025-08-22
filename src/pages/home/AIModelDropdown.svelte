<script lang="ts">
  import { onMount } from "svelte";
  import { useTranslations } from "$i18n/utils";
  import { tenant } from "$stores";
  import { ApiKeyProvider } from "$types/TenantFeature";
  import { PromptModel } from "$types/PromptModel";
  import Dropdown, { type Option } from "$components/form/Dropdown.svelte";
  import {
    CustomSortOrder,
    ModelNameMap,
    ProviderModelMap,
  } from "$types/AIProvider";

  const t = useTranslations();

  interface Props {
    label?: string;
    selectedModel: string;
    classes?: string;
    labelClasses?: string;
    disabled?: boolean;
  }

  let {
    label,
    selectedModel = $bindable(""),
    classes = "",
    labelClasses = "",
    disabled = $bindable(false),
  }: Props = $props();

  let models: Option[] = $state([]);

  onMount(async function () {
    models = getActiveModels() || [];
  });

  const getModelLabel = (provider: any) => {
    const key = ProviderModelMap[provider.name] as keyof typeof $tenant;
    const rawModel = $tenant?.[key] || "gpt-4o";
    const modelLabel = ModelNameMap[rawModel] || rawModel;

    let title = "-";
    switch (provider.name) {
      case PromptModel.OpenAI:
        title = `${modelLabel} (${t("home.model-option-text-tools")})`;
        break;
      case PromptModel.OpenAIGpt5:
        title = `${modelLabel} (${t("home.model-option-text-tools")})`;
        break;
      case PromptModel.Perplexity:
        title = `${modelLabel} (${t("home.model-option-text-websearch")})`;
        break;
      case PromptModel.Claude:
        title = `${modelLabel} (${t("home.model-option-text")})`;
        break;
      case PromptModel.Gemini:
        title = `${modelLabel} (${t("home.model-option-text-tools")})`;
        break;
    }
    return title;
  };

  function sortProviders(providers: any[]): any[] {
    return providers.sort((a, b) => {
      const orderA = CustomSortOrder[a.value] || Infinity;
      const orderB = CustomSortOrder[b.value] || Infinity;
      return orderA - orderB;
    });
  }

  const getActiveModels = (): Option[] => {
    const allProviders = $tenant?.api_key_providers ?? [];
    const allowedProviders = [
      ApiKeyProvider.Perplexity,
      ApiKeyProvider.Claude,
      ApiKeyProvider.OpenAIGtp5,
      ApiKeyProvider.Gemini,
    ];

    const models: Option[] =
      allProviders
        .filter(
          (provider: any) =>
            provider.active && allowedProviders.includes(provider.name),
        )
        .map((provider: any) => {
          const modelName = getModelLabel(provider);
          return {
            value: provider.name,
            title: `${modelName}`,
          };
        }) || [];

    // OpenAI Responses API
    models.push({
      value: PromptModel.OpenAIWithTools,
      title: `gpt-4o (${t("home.model-option-text-tools")})`,
    });

    return sortProviders(models);
  };
</script>

<Dropdown
  classes={"flex-1 min-w-3xs " + classes}
  {labelClasses}
  label={label ?? t("prompt-library.add.prompts.language-model")}
  placeholder={""}
  options={models}
  {disabled}
  bind:value={selectedModel}
/>
