export enum ModelName {
  // OpenAI
  Gpt4o = "gpt-4o", // Text & Tools (Image) (Azure)
  Gpt5 = "gpt-5.1", // Text & Tools (Image, Thinking)
  Dalle = "dall-e-3", // Image Generation
  GptImage = "gpt-image-1", // Prompt Image tool

  // Azure
  Whisper = "whisper-1", // Audio Transcription
  AudioPro = "Audio Pro", // Audio Transcription

  // ElevenLab
  ElevenLabs = "scribe_v1", // Audio Transcription

  // Claude
  ClaudeSonnet46 = "claude-sonnet-4-6", // Text

  // Google
  Gemini31FlashLite = "gemini-3.1-flash-lite-preview", // Text & Tools (Websearch, Thinking)
  Gemini25FlashImage = "gemini-2.5-flash-image", // Image Generation
  Gemini3ProImage = "gemini-3-pro-image-preview", // Image Generation

  // Perplexity
  Sonar = "sonar", // Text & Tools (Websearch)
  SonarPro = "sonar-pro", // Text & Tools (Websearch)

  // Flux
  FluxDev = "fal-ai/flux/dev", // Image Generation
}

export enum TextVerbosityOption {
  Low = "low",
  Medium = "medium",
  High = "high",
}

export enum ReasoningEffortOption {
  None = "none",
  Minimal = "minimal",
  Low = "low",
  Medium = "medium",
  High = "high",
}

export enum PromptToolOption {
  None = "",
  Image = "image",
  Websearch = "websearch",
  Thinking = "thinking",
}

// Vector KB Embedding Providers
export enum EmbeddingProvider {
  OpenAI = "openai",
  AzureOpenAI = "azure_openai",
  Gemini = "gemini",
}

// Vector KB Scope for prompts
export enum VectorKBScope {
  All = "all",
  Folder = "folder",
  DataSource = "data_source",
}
