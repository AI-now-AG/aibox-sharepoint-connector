export enum ModelName {
  // OpenAI
  Gpt4o = "gpt-4o", // Text & Tools (Image) (Azure)
  Gpt5Old = "gpt-5", // Text & Tools (Image, Thinking)
  Gpt5 = "gpt-5.1", // Text & Tools (Image, Thinking)
  Dalle = "dall-e-3", // Image Generation
  GptImage = "gpt-image-1", // Prompt Image tool

  // Azure
  Whisper = "whisper-1", // Audio Transcription
  AudioPro = "Audio Pro", // Audio Transcription

  // ElevenLab
  ElevenLabs = "scribe_v1", // Audio Transcription

  // Claude
  ClaudeSonnet40 = "claude-sonnet-4-0", // Text

  // Google
  Gemini25Flash = "gemini-2.5-flash", // Text & Tools (Websearch, Thinking)
  Gemini25FlashImage = "gemini-2.5-flash-image-preview", // Image Generation

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
