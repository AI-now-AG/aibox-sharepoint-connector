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
  }

  let {
    label,
    models = $bindable([]),
    selectedModel = $bindable(""),
  }: Props = $props();

  onMount(async function () {
    models = getActiveModels() || [];
  });

  const getModelName = (provider: { name: string }) => {
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
    const models =
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

    return models;
  };
</script>

<SelectOptions
  classes="flex-1 min-w-3xs"
  label={label ?? t("prompt-library.add.prompts.language-model")}
  placeholder={`${t("tenant.default")} (OpenAI gtp-4o)`}
  options={models}
  bind:value={selectedModel}
></SelectOptions>
