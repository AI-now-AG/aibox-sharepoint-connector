<script lang="ts">
  import { onMount } from "svelte";
  import { useTranslations } from "$i18n/utils";
  import { capitalizeFirst } from "$utils/common";
  import { tenant } from "$stores";
  import { PromptModel } from "$types/PromptModel";
  import { ApiKeyProvider } from "$types/TenantFeature";
  import Dropdown, { type Option } from "$components/form/Dropdown.svelte";

  const t = useTranslations();

  interface Props {
    label?: string;
    selectedModel: string;
    classes?: string;
    labelClasses?: string;
    disabled?: boolean;
    excludePromptOptions?: boolean;
  }

  let {
    label,
    selectedModel = $bindable(""),
    classes = "",
    labelClasses = "",
    disabled = $bindable(false),
    excludePromptOptions = false,
  }: Props = $props();

  let models: Option[] = $state([]);

  //$inspect(models);

  onMount(async function () {
    models = getActiveModels() || [];
  });

  const getModelName = (provider: any) => {
    const key = `${provider.name}_chat_model` as keyof typeof $tenant;
    return $tenant?.[key] || "gpt-4o";
  };

  const getProviderName = (provider: any) => {
    let title;
    switch (provider.name) {
      case PromptModel.AzureOpenAI:
        title = t("tenant.azure-open-ai-provider");
        break;
      case PromptModel.Perplexity:
        title = t("tenant.perplexity-provider");
        break;
      default:
        title = t("tenant.open-ai-provider");
    }
    return title;
  };

  const sortProviders = (providers: any[]) => {
    const sortOrder = [
      ApiKeyProvider.OpenAI,
      ApiKeyProvider.AzureOpenAI,
      ApiKeyProvider.Perplexity,
    ];
    return providers.slice().sort((a, b) => {
      return sortOrder.indexOf(a.name) - sortOrder.indexOf(b.name);
    });
  };

  const getActiveModels = (): Option[] => {
    const rawProviders = $tenant?.api_key_providers ?? [];
    const sortedProviders = sortProviders(rawProviders);

    const models: Option[] =
      sortedProviders
        .filter((provider: any) => provider.active)
        .map((provider: any) => {
          const providerName = getProviderName(provider);
          const modelName = getModelName(provider);
          const suffix =
            provider.name == ApiKeyProvider.OpenAI && !excludePromptOptions
              ? " (Legacy)"
              : "";
          return {
            value: provider.name,
            title: `${providerName} ${modelName}${suffix}`,
          };
        }) || [];

    if (!excludePromptOptions) {
      const defaultModel = sortedProviders.find(
        (provider: any) => provider.default,
      );
      const defaultText = t("tenant.default");
      const defaultName = capitalizeFirst(defaultText);

      const providerName = getProviderName(defaultModel);
      const modelName = getModelName(defaultModel);
      const suffix =
        defaultModel.name == ApiKeyProvider.OpenAI ? " (Legacy)" : "";
      models.unshift({
        value: PromptModel.Default,
        title: `${defaultName} - ${providerName} ${modelName}${suffix}`,
      });
    }

    // OpenAI Responses API
    if (!excludePromptOptions) {
      models.push({
        value: PromptModel.OpenAIWithTools,
        title: t("prompt-execution.models.openai-with-tools"),
      });
      models.push({
        value: PromptModel.OpenAIWithImageTools,
        title: t("prompt-execution.models.openai-with-image-tools"),
      });
    }

    return models;
  };
</script>

<Dropdown
  classes={"flex-1 min-w-3xs " + classes}
  {labelClasses}
  label={label ?? t("prompt-library.add.prompts.language-model")}
  placeholder={`${t("tenant.default")} (OpenAI gtp-4o)`}
  options={models}
  {disabled}
  bind:value={selectedModel}
/>
