<script lang="ts">
  import { onMount } from "svelte";
  import { useTranslations } from "$i18n/utils";
  import { capitalizeFirst } from "$utils/common";
  import { tenant } from "$stores";
  import { PromptModel } from "$types/PromptModel";
  import { ApiKeyProvider } from "$types/TenantFeature";
  import Dropdown, { type Option } from "$components/form/Dropdown.svelte";
  import {
    CustomSortOrder,
    ModelNameMap,
    ProviderModelMap,
    isProviderActive,
  } from "$shared/AIProvider";

  const t = useTranslations();

  interface Props {
    label?: string;
    selectedModel: string;
    classes?: string;
    labelClasses?: string;
    disabled?: boolean;
    onValueChange?: Function;
  }

  let {
    label,
    selectedModel = $bindable(""),
    classes = "",
    labelClasses = "",
    disabled = $bindable(false),
    onValueChange,
  }: Props = $props();

  let models: Option[] = $state([]);

  onMount(async function () {
    models = getActiveModels() || [];
  });

  $inspect(selectedModel);

  const getModelLabel = (provider: any) => {
    const key = ProviderModelMap[provider?.name] as keyof typeof $tenant;
    const rawModel = $tenant?.[key] || "gpt-4o";
    const modelLabel = ModelNameMap[rawModel] || rawModel;

    let title;
    switch (provider.name) {
      case PromptModel.OpenAI:
        title = `${modelLabel} (${t("home.model-option-text-tools")})`;
        break;
      case PromptModel.OpenAIGpt5:
        title = t("prompt-execution.models.openai-gpt-5-with-tools", {
          model: modelLabel,
        });
        break;
      case PromptModel.AzureOpenAI:
        title = t("prompt-execution.models.azure-openai", {
          model: modelLabel,
        });
        break;
      case PromptModel.Perplexity:
        title = t("prompt-execution.models.perplexity", { model: modelLabel });
        break;
      case PromptModel.Claude:
        title = t("prompt-execution.models.claude", { model: modelLabel });
        break;
      case PromptModel.Gemini:
        title = t("prompt-execution.models.gemini-with-tools", {
          model: modelLabel,
        });
        break;
      default:
        title = t("prompt-execution.models.openai-legacy", {
          model: modelLabel,
        });
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

  let rawProviders = $tenant?.api_key_providers ?? [];
  const defaultModel = rawProviders.find((provider: any) => provider.default);
  const defaultText = t("tenant.default");
  const defaultName = capitalizeFirst(defaultText);
  const defaultModelName = getModelLabel(defaultModel);

  const getActiveModels = (): Option[] => {
    const providers = rawProviders.filter((provider: any) => !provider.default);

    const models: Option[] =
      providers
        .filter((provider: any) => provider.active)
        .map((provider: any) => {
          const modelName = getModelLabel(provider);
          return {
            value: provider.name,
            title: `${modelName}`,
          };
        }) || [];

    // Nano Banana
    if (isProviderActive($tenant, ApiKeyProvider.Gemini)) {
      models.push({
        value: PromptModel.NanoBanana,
        title: t("prompt-execution.models.nano-banana"),
      });
    }

    sortProviders(models);

    models.unshift({
      value: defaultModel?.name || PromptModel.Default,
      title: `${defaultName} - ${defaultModelName}`,
    });

    return models;
  };

  $effect(() => {
    if (!selectedModel) {
      selectedModel = defaultModel?.name || PromptModel.Default;
    }
  });
</script>

<Dropdown
  classes={"flex-1 min-w-3xs " + classes}
  {labelClasses}
  label={label ?? t("prompt-library.add.prompts.language-model")}
  placeholder={`${defaultName} - ${defaultModelName}`}
  options={models}
  {disabled}
  {onValueChange}
  bind:value={selectedModel}
/>
