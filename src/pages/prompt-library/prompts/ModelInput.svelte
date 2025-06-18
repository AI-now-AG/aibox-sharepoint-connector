<script lang="ts">
  import { onMount } from "svelte";
  import { useTranslations } from "$i18n/utils";
  import { tenant } from "$stores";
  import { PromptModel } from "$types/PromptModel";
  import Dropdown, { type Option } from "$components/form/Dropdown.svelte";

  const t = useTranslations();

  interface Props {
    label?: string;
    models?: Option[];
    selectedModel: string;
    classes?: string;
    labelClasses?: string;
    disabled?: boolean;
    skipDefaultOption?: boolean;
  }

  let {
    label,
    models = $bindable([]),
    selectedModel = $bindable(""),
    classes = "",
    labelClasses = "",
    disabled = $bindable(false),
    skipDefaultOption = false,
  }: Props = $props();

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

  const getActiveModels = (): Option[] => {
    const models: Option[] =
      ($tenant?.api_key_providers ?? [])
        ?.filter((provider: any) => provider.active)
        .map((provider: any) => {
          const providerName = getProviderName(provider);
          const modelName = getModelName(provider);
          return {
            value: provider.name,
            title: `${providerName} ${modelName}`,
          };
        }) || [];

    if (!skipDefaultOption) {
      const defaultModel = $tenant?.api_key_providers?.find(
        (provider: any) => provider.default,
      );
      const defaultText = t("tenant.default");
      const defaultName = defaultText.replace(
        /^./,
        defaultText[0].toUpperCase(),
      );
      models.unshift({
        value: PromptModel.Default,
        title: `${defaultName} (${getProviderName(defaultModel)} ${getModelName(defaultModel)})`,
      });
    }

    // OpenAI Responses API
    models.push({
      value: PromptModel.OpenAIWithTools,
      title: `Open AI gpt-4o (New)`,
    });
    models.push({
      value: PromptModel.OpenAIWithImageTools,
      title: `Open AI gpt-4o with Image`,
    });

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
