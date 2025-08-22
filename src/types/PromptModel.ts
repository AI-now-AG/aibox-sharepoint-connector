export enum PromptModel {
  Default = "",

  OpenAI = "openai",
  OpenAIWithTools = "openai:tools",
  OpenAIWithImageTools = "openai:tools:image",

  OpenAIGpt5 = "openai-gpt-5",

  AzureOpenAI = "azure_openai",
  Perplexity = "perplexity",
  Claude = "claude",

  Gemini = "gemini",
}
