<script lang="ts">
  import { onMount } from "svelte";
  import { useTranslations } from "$i18n/utils";
  import { tenant } from "$stores";
  import { ApiKeyProvider } from "$types/TenantFeature";
  import { PromptModel } from "$types/PromptModel";
  import Dropdown, { type Option } from "$components/form/Dropdown.svelte";

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

  //$inspect(models);

  onMount(async function () {
    models = getActiveModels() || [];
  });

  const getModelLabel = (provider: any) => {
    const providerModelMap: Record<string, string> = {
      [ApiKeyProvider.Perplexity]: "perplexity_chat_model",
      [ApiKeyProvider.Claude]: "anthropic_chat_model",
    };
    const modelNameMap: Record<string, string> = {
      "claude-sonnet-4-0": "Claude Sonnet",
      "sonar": "Perplexity Sonar",
    };

    const key = providerModelMap[provider.name] as keyof typeof $tenant;
    const rawModel = $tenant?.[key] || "gpt-4o";
    const modelLabel = modelNameMap[rawModel] || rawModel;

    let title = '-';
    switch (provider.name) {
    case PromptModel.OpenAI:
        title = `${modelLabel} (${t("home.model-option-text-tools")})`;
        break;
      case PromptModel.Perplexity:
        title = `${modelLabel} (${t("home.model-option-text-websearch")})`;
        break;
      case PromptModel.Claude:
        title = `${modelLabel} (${t("home.model-option-text")})`;
        break;
    }
    return title;
  };

  const sortModelOptions = (models: any[]) => {
    const sortOrder = [
      PromptModel.OpenAIWithTools,
      PromptModel.Claude,
      PromptModel.Perplexity,
    ];
    return models.slice().sort((a, b) => {
      return sortOrder.indexOf(a.value) - sortOrder.indexOf(b.value);
    });
  };

  const getActiveModels = (): Option[] => {
    const allProviders = $tenant?.api_key_providers ?? [];
    const allowedProviders = [ApiKeyProvider.Perplexity, ApiKeyProvider.Claude];

    const models: Option[] =
      allProviders
        .filter((provider: any) => provider.active && allowedProviders.includes(provider.name))
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

    return sortModelOptions(models);
  };
</script>

<Dropdown
  classes={"flex-1 min-w-3xs " + classes}
  {labelClasses}
  label={label ?? t("prompt-library.add.prompts.language-model")}
  placeholder={''}
  options={models}
  {disabled}
  bind:value={selectedModel}
/>
