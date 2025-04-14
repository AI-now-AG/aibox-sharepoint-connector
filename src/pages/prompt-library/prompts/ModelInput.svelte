<script lang="ts">
  import { onMount } from "svelte";
  import { useTranslations } from "$i18n/utils";
  import { tenant } from "$stores";
  import { ApiKeyProvider } from "$types/TenantFeature";
  import type { Option } from "$components/SelectOptions.svelte";
  import SelectOptions from "$components/SelectOptions.svelte";

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
    setTimeout(() => {
      models = getActiveModels() || [];
    }, 0);
  });

  const getModelName = (provider: any) => {
    const key = `${provider.name}_chat_model` as keyof typeof $tenant;
    return $tenant?.[key] || "gpt-4o";
  };

  const getProviderName = (provider: any) => {
    let title;
    switch (provider.name) {
      case ApiKeyProvider.AzureOpenAI:
        title = t("tenant.azure-open-ai-provider");
        break;
      case ApiKeyProvider.Perplexity:
        title = t("tenant.perplexity-provider");
        break;
      default:
        title = t("tenant.open-ai-provider");
    }
    return title;
  };

  const getActiveModels = (): Option[] => {
    const models: any[] =
      $tenant?.api_key_providers
        ?.filter((provider) => provider.active)
        .map((provider) => {
          const providerName = getProviderName(provider);
          const modelName = getModelName(provider);
          return {
            value: provider.name,
            label: `${providerName} ${modelName}`,
          };
        }) || [];
    if (!skipDefaultOption) {
      const defaultModel = $tenant?.api_key_providers?.find(
        (provider) => provider.default,
      );
      const defaultText = t("tenant.default");
      const defaultName = defaultText.replace(
        /^./,
        defaultText[0].toUpperCase(),
      );
      models?.unshift({
        value: ApiKeyProvider.Default,
        label: `${defaultName} (${getProviderName(defaultModel)} ${getModelName(defaultModel)})`,
      });
    }

    return models;
  };
</script>

<SelectOptions
  classes={"flex-1 min-w-3xs " + classes}
  {labelClasses}
  label={label ?? t("prompt-library.add.prompts.language-model")}
  placeholder={`${t("tenant.default")} (OpenAI gtp-4o)`}
  options={models}
  {disabled}
  bind:value={selectedModel}
></SelectOptions>
