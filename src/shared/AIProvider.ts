/* eslint-disable @typescript-eslint/no-explicit-any */
import { useTranslations } from "$i18n/utils";
import { PromptToolOption } from "$types/AIProvider";
import { PromptModel } from "$types/PromptModel";
import { ApiKeyProvider } from "$types/TenantFeature";
import { svgIcons } from "$assets/icons";

const t = useTranslations();

export const ModelNameMap: Record<string, string> = {
  "claude-sonnet-4-0": "Claude Sonnet",
  sonar: "Perplexity Sonar",
  "gemini-2.5-flash": "Gemini 2.5 Flash",
};

export const ProviderMap: Partial<Record<ApiKeyProvider, string>> = {
  [ApiKeyProvider.OpenAI]: ApiKeyProvider.OpenAI,
  [ApiKeyProvider.OpenAIGpt5]: ApiKeyProvider.OpenAI,
  [ApiKeyProvider.AzureOpenAI]: ApiKeyProvider.OpenAI,
  [ApiKeyProvider.Perplexity]: ApiKeyProvider.Perplexity,
  [ApiKeyProvider.Claude]: ApiKeyProvider.Claude,
  [ApiKeyProvider.Gemini]: ApiKeyProvider.Gemini,
};

export const ProviderModelMap: Record<string, string> = {
  [ApiKeyProvider.OpenAI]: "openai_chat_model",
  [ApiKeyProvider.OpenAIGpt5]: "openai_gpt5_chat_model",
  [ApiKeyProvider.AzureOpenAI]: "azure_openai_chat_model",
  [ApiKeyProvider.Perplexity]: "perplexity_chat_model",
  [ApiKeyProvider.Claude]: "anthropic_chat_model",
  [ApiKeyProvider.Gemini]: "gemini_chat_model",
};

export const ProviderPromptModelNameMap: Record<string, string> = {
  [ApiKeyProvider.OpenAI]: PromptModel.OpenAI,
  [ApiKeyProvider.OpenAIGpt5]: PromptModel.OpenAIGpt5,
  [ApiKeyProvider.AzureOpenAI]: PromptModel.AzureOpenAI,
  [ApiKeyProvider.Perplexity]: PromptModel.Perplexity,
  [ApiKeyProvider.Claude]: PromptModel.Claude,
  [ApiKeyProvider.Gemini]: PromptModel.Gemini,
};

export const ModelNameProviderPromptMap: Record<string, string> = {
  [PromptModel.OpenAI]: ApiKeyProvider.OpenAI,
  [PromptModel.OpenAIGpt5]: ApiKeyProvider.OpenAIGpt5,
  [PromptModel.AzureOpenAI]: ApiKeyProvider.AzureOpenAI,
  [PromptModel.Perplexity]: ApiKeyProvider.Perplexity,
  [PromptModel.Claude]: ApiKeyProvider.Claude,
  [PromptModel.Gemini]: ApiKeyProvider.Gemini,
};

export const CustomSortOrder: { [key: string]: number } = {
  [PromptModel.Default]: 1, // Default - gpt-4o, Legacy (Text)
  [PromptModel.OpenAI]: 2, // gpt-4o, Legacy (Text)
  [PromptModel.OpenAIGpt5]: 3, // gpt-5 (Text & Tools)
  [PromptModel.AzureOpenAI]: 4, // Azure gpt-4o (Text)
  [PromptModel.Perplexity]: 5, // Perplexity Sonar (Text & Websuche)
  [PromptModel.Claude]: 6, // Claude Sonnet (Text)
  [PromptModel.Gemini]: 7, // Gemini (Text& Tools)
  [PromptModel.NanoBanana]: 8, // Gemini Nano Banana
};

export const Gpt4oPromptTools = [
  {
    title: t("prompt-execution.prompt-tool.image"),
    value: PromptToolOption.Image,
    icon: svgIcons.image,
  },
];

export const Gpt5PromptTools = [
  {
    title: t("prompt-execution.prompt-tool.image"),
    value: PromptToolOption.Image,
    icon: svgIcons.image,
  },
];

export const PerplexityPromptTools = [];

export const GeminiPromptTools = [
  {
    title: t("prompt-execution.prompt-tool.web-search"),
    value: PromptToolOption.Websearch,
    icon: svgIcons.web,
  },
];

export const NanoBananaPromptTools = [
  {
    title: t("prompt-execution.prompt-tool.image"),
    value: PromptToolOption.Image,
    icon: svgIcons.web,
  },
];

export function getPromptTools(promptModel: PromptModel) {
  switch (promptModel) {
    case PromptModel.OpenAI:
      return Gpt4oPromptTools;
    case PromptModel.OpenAIGpt5:
      return Gpt5PromptTools;
    case PromptModel.Gemini:
      return GeminiPromptTools;
    default:
      return undefined;
  }
}

export function getProviderFromPromptModel(promptModel: PromptModel) {
  return ModelNameProviderPromptMap[promptModel] ?? ApiKeyProvider.OpenAI;
}

export function getProviderModelName(
  tenant: any,
  providerName: ApiKeyProvider,
) {
  const key = ProviderModelMap[providerName] as keyof typeof tenant;
  const rawModel = tenant?.[key] || "gpt-4o";
  return ModelNameMap[rawModel] || rawModel;
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
