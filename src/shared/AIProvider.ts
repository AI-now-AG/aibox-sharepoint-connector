/* eslint-disable @typescript-eslint/no-explicit-any */
import { useTranslations } from "$i18n/utils";
import { PromptToolOption } from "$types/AIProvider";
import { PromptModel } from "$types/PromptModel";
import { ApiKeyProvider } from "$types/TenantFeature";

const t = useTranslations();

export const ProviderModelMap: Record<string, string> = {
  [ApiKeyProvider.Perplexity]: "perplexity_chat_model",
  [ApiKeyProvider.Claude]: "anthropic_chat_model",
  [ApiKeyProvider.OpenAI]: "openai_chat_model",
  [ApiKeyProvider.OpenAIGtp5]: "openai_gpt5_chat_model",
  [ApiKeyProvider.AzureOpenAI]: "azure_openai_chat_model",
  [ApiKeyProvider.Gemini]: "gemini_chat_model",
};

export const ModelNameMap: Record<string, string> = {
  "claude-sonnet-4-0": "Claude Sonnet",
  sonar: "Perplexity Sonar",
  "gemini-2.5-flash": "gemini-2.5-flash",
};

export const ProviderPromptModelNameMap: Record<string, string> = {
  [ApiKeyProvider.Perplexity]: PromptModel.Perplexity,
  [ApiKeyProvider.Claude]: PromptModel.Claude,
  [ApiKeyProvider.OpenAI]: PromptModel.OpenAI,
  [ApiKeyProvider.OpenAIGtp5]: PromptModel.OpenAIGpt5,
  [ApiKeyProvider.AzureOpenAI]: PromptModel.AzureOpenAI,
  [ApiKeyProvider.Gemini]: PromptModel.Gemini,
};

export const CustomSortOrder: { [key: string]: number } = {
  [PromptModel.Default]: 1, // Default - gpt-4o, Legacy (Text)
  [PromptModel.OpenAIWithTools]: 2, // gpt-4o (Text & Tools)
  [PromptModel.OpenAIGpt5]: 3, // gpt-5 (Text & Tools)
  [PromptModel.AzureOpenAI]: 4, // Azure gpt-4o (Text)
  [PromptModel.Perplexity]: 5, // Perplexity Sonar (Text & Websuche)
  [PromptModel.Claude]: 6, // Claude Sonnet (Text)
  [PromptModel.Gemini]: 7, // gemini (Text& Tools)
  [PromptModel.OpenAIWithImageTools]: 8, // gpt Image (Bilder)
  [PromptModel.OpenAI]: 9, // gpt-4o, Legacy (Text)
};

export const Gpt4oPromptTools = [
  {
    title: t("prompt-execution.prompt-tool.image"),
    value: PromptToolOption.Image,
  },
];

export const Gpt5PromptTools = [
  {
    title: t("prompt-execution.prompt-tool.image"),
    value: PromptToolOption.Image,
  },
  {
    title: t("prompt-execution.prompt-tool.thinking"),
    value: PromptToolOption.Thinking,
  },
];

export const PerplexityPromptTools = [
  {
    title: t("prompt-execution.prompt-tool.web-search"),
    value: PromptToolOption.Websearch,
  },
];

export const GeminiPromptTools = [
  {
    title: t("prompt-execution.prompt-tool.web-search"),
    value: PromptToolOption.Websearch,
  },
  {
    title: t("prompt-execution.prompt-tool.thinking"),
    value: PromptToolOption.Thinking,
  },
];

export function getPromptTools(promptModel: PromptModel) {
  switch (promptModel) {
    case PromptModel.OpenAI:
    case PromptModel.OpenAIWithTools:
    case PromptModel.OpenAIWithImageTools:
      return Gpt4oPromptTools;
    case PromptModel.OpenAIGpt5:
      return Gpt5PromptTools;
    case PromptModel.Perplexity:
      return PerplexityPromptTools;
    case PromptModel.Gemini:
      return GeminiPromptTools;
    default:
      return undefined;
  }
}

export function useProviderInfo(tenant: any) {
  if (!tenant) {
    return undefined;
  }
  const getDefaultProvider = () => {
    const aiProviders = tenant?.api_key_providers ?? [];
    const activeDefaultProvider = aiProviders.find(
      (item: any) => item.active === true && item.default === true,
    );
    return activeDefaultProvider ?? { name: ApiKeyProvider.OpenAI };
  };

  const getDefaultProviderModelName = () => {
    const defaultProvider = getDefaultProvider();
    const providerName = defaultProvider.name;
    const key = ProviderModelMap[providerName] as keyof typeof tenant;
    const rawModel = tenant?.[key] || "gpt-4o";
    return ModelNameMap[rawModel] || rawModel;
  };

  const getDefaultProviderPromptModelName = () => {
    const defaultProvider = getDefaultProvider();
    return ProviderPromptModelNameMap[defaultProvider.name];
  };

  return {
    aiProviders: tenant?.api_key_providers ?? [],
    defaultProvider: getDefaultProvider(),
    defaultProviderModelName: getDefaultProviderModelName(),
    defaultProviderPromptModelName: getDefaultProviderPromptModelName(),
  };
}
