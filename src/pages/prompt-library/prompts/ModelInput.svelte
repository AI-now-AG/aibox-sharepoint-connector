<script lang="ts">
  import { onMount } from "svelte";
  import { useTranslations } from "$i18n/utils";
  import SingleInput from "./SingleInput.svelte";
  import { tenant } from "$stores";
  import { ApiKeyProvider } from "$types/TenantFeature";
  import { preventDefault } from "$utils/common";

  const t = useTranslations();

  type Item = { title: string } | string;

  interface Props {
    models: Item[];
    selectedModel: Item | undefined;
  }

  let { models = $bindable([]), selectedModel = $bindable() }: Props = $props();

  onMount(async function () {
    models = getActiveModels();
  });

  const getModelName = (provider) => {
    return $tenant[`${provider.name}_chat_model`] || "gpt-4o";
  };

  const getProviderName = (provider) => {
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

  const getActiveModels = () => {
    const defaultModel = $tenant.api_key_providers.find(
      (provider) => provider.default,
    );

    const models = $tenant.api_key_providers
      .filter((provider) => provider.active)
      .map((provider) => {
        const providerName = getProviderName(provider);
        const modelName = getModelName(provider);
        return {
          _id: `${provider.name}`,
          title: `${providerName} ${modelName}`,
        };
      });
    const defaultText = t("tenant.default");
    const defaultName = defaultText.replace(/^./, defaultText[0].toUpperCase());
    const defaultOptionTitle = models.unshift({
      _id: null,
      title: `${defaultName} (${getProviderName(defaultModel)} ${getModelName(defaultModel)})`,
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
