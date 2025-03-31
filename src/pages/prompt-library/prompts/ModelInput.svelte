<script lang="ts">
  import { onMount } from "svelte";
  import { useTranslations } from "$i18n/utils";
  import SingleInput from "./SingleInput.svelte";
  import { tenant } from "$stores";
  import { ApiKeyProvider } from "$types/TenantFeature";

  const t = useTranslations();

  type Item = { title: string } | string;

  interface Props {
    models: Item[];
    selectedModel: Item | undefined;
  }

  let { models = $bindable([]), selectedModel = $bindable() }: Props = $props();

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

  const getActiveModels = (): Item[] => {
    const defaultModel = $tenant?.api_key_providers?.find(
      (provider) => provider.default,
    );

    const models =
      $tenant?.api_key_providers
        ?.filter((provider) => provider.active)
        .map((provider) => {
          const providerName = getProviderName(provider);
          const modelName = getModelName(provider);
          return {
            _id: `${provider.name}`,
            title: `${providerName} ${modelName}`,
          };
        }) || [];
    const defaultText = t("tenant.default");
    const defaultName = defaultText.replace(/^./, defaultText[0].toUpperCase());
    models.unshift({
      _id: "default",
      title: `${defaultName} (${getProviderName(defaultModel ?? { name: "" })} ${getModelName(defaultModel ?? { name: "" })})`,
    });
    return models;
  };
</script>

<SingleInput
  title={t("prompt-library.add.prompts.language-model")}
  placeholder="OpenAI gtp-4o"
  items={models}
  bind:selectedItem={selectedModel}
/>
