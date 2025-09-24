import { useTranslations } from "$i18n/utils";
const t = useTranslations();

export enum TenantFeature {
  TextPrompts = "text-prommpts",
  AudioToText = "audio-to-text",
  CreateImage = "create-image",
  GptImage = "gpt-image",
}

export enum ApiKeyProvider {
  OpenAI = "openai",
  OpenAIGpt5 = "openai-gpt-5",
  AzureOpenAI = "azure_openai",
  Perplexity = "perplexity",
  Flux = "flux",
  ElevenLabs = "eleven-labs",
  Claude = "claude",
  Gemini = "gemini",
}

export enum AudioCategory {
  AudioToText = "audio-to-text",
  Subtitle = "subtitle",
  SubtitleJson = "subtitle-json",
  SubtitleLarge = "subtitle-large",
  Subtitle11Labs = "subtitle-11Labs",
  AudioPro = "audio-pro",
}

export const AudioCategoryLabels: Record<AudioCategory, string> = {
  [AudioCategory.AudioToText]: t("nav.audiotool.audio-to-text"),
  [AudioCategory.Subtitle]: t("tenant.subtitles"),
  [AudioCategory.SubtitleJson]: t("tenant.subtitles-json"),
  [AudioCategory.SubtitleLarge]: t("tenant.subtitle-large"),
  [AudioCategory.Subtitle11Labs]: t("tenant.subtitle-elevenLabs"),
  [AudioCategory.AudioPro]: t("tenant.audio-pro"),
};

export enum AzureTTSModel {
  Whisper = "whisper-1",
  AudioPro = "Audio Pro",
  ElevenLabs = "scribe_v1",
}
