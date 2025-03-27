import { useTranslations } from "$i18n/utils";
const t = useTranslations();

export enum TenantFeature {
  TextPrommpts = "text-prommpts",
  AudioToText = "audio-to-text",
  CreateImage = "create-image",
}

export enum ApiKeyProvider {
  OpenAI = "openai",
  AzureOpenAI = "azure_openai",
  Perplexity = "perplexity",
  Flux = "flux",
}

export enum AudioCategory {
  AudioToText = "audio-to-text",
  Subtitle = "subtitle",
  SubtitleJson = "subtitle-json",
  SubtitleLarge = "subtitle-large",
  AudioPro = "audio-pro",
}

export const AudioCategoryLabels: Record<AudioCategory, string> = {
  [AudioCategory.AudioToText]: t("nav.audiotool.audio-to-text"),
  [AudioCategory.Subtitle]: t("tenant.subtitles"),
  [AudioCategory.SubtitleJson]: t("tenant.subtitles-json"),
  [AudioCategory.SubtitleLarge]: t("tenant.subtitle-large"),
  [AudioCategory.AudioPro]: t("tenant.audio-pro"),
};
