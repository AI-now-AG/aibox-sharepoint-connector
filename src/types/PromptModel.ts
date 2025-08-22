export enum PromptModel {
  Default = "",
  
  OpenAI = "openai",
  OpenAIWithTools = "openai:tools",
  OpenAIWithImageTools = "openai:tools:image",

  OpenAIGpt5 = "openai-gpt-5",
  OpenAIGpt5WithTools = "openai-gpt-5:tools",
  OpenAIGpt5WithImageTools = "openai-gpt-5:tools:image",

  AzureOpenAI = "azure_openai",
  Perplexity = "perplexity",
  Claude = "claude",

  Gemini = "gemini",
}
