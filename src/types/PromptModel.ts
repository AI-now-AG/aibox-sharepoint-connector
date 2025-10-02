export enum PromptModel {
  Default = "",
  OpenAI = "openai",
  OpenAIWithTools = "openai:tools", // Deprecated — removal imminent
  OpenAIWithImageTools = "openai:tools:image", // Deprecated — removal imminent
  OpenAIGpt5 = "openai-gpt-5",
  AzureOpenAI = "azure_openai",
  Perplexity = "perplexity",
  Claude = "claude",
  Gemini = "gemini",
}
