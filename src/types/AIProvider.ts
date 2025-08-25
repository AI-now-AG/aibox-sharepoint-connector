import { PromptModel } from "./PromptModel";
import { ApiKeyProvider } from "./TenantFeature";

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

export enum TextVerbositiOption {
  Low = "low",
  Medium = "medium",
  High = "high",
}

export enum ReasoningEffortOption {
  Minimal = "minimal",
  Low = "low",
  Medium = "medium",
  High = "high",
}

export enum PromptToolOption {
  ImageGeneration = "image_generation",
  Websearch = "websearch",
  Thinking = "thinking",
}
