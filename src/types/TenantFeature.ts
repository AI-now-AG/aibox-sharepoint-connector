/* eslint-disable @typescript-eslint/no-explicit-any */
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
  GeminiPro = "gemini-pro"
}

export enum AudioCategory {
  AudioToText = "audio-to-text",
  Subtitle = "subtitle",           // Deprecated: Allegro (M) - commented for future restoration
  SubtitleJson = "subtitle-json",  // Deprecated: commented for future restoration
  SubtitleLarge = "subtitle-large", // Deprecated: Adagio (L) - commented for future restoration
  Subtitle11Labs = "subtitle-11Labs",
  AudioPro = "audio-pro",
}

export const AudioCategoryLabels: Record<AudioCategory, string> = {
  [AudioCategory.AudioToText]: t("nav.audiotool.audio-to-text"),
  [AudioCategory.Subtitle]: t("tenant.subtitles"),       // Deprecated: Allegro (M)
  [AudioCategory.SubtitleJson]: t("tenant.subtitles-json"), // Deprecated: commented for future restoration
  [AudioCategory.SubtitleLarge]: t("tenant.subtitle-large"), // Deprecated: Adagio (L)
  [AudioCategory.Subtitle11Labs]: t("tenant.subtitle-elevenLabs"),
  [AudioCategory.AudioPro]: t("tenant.audio-pro"),
};

export enum AzureTTSModel {
  Whisper = "whisper-1",
  AudioPro = "Audio Pro",
  ElevenLabs = "scribe_v1",
}

export enum LanguageCode {
  En = "en",
  De = "de",
}

export const LanguageMap: Record<LanguageCode, any> = {
  [LanguageCode.De]: { title: "Deutsch", value: LanguageCode.De },
  [LanguageCode.En]: { title: "English", value: LanguageCode.En },
};

export const Languges = [
  LanguageMap[LanguageCode.En], LanguageMap[LanguageCode.De]
]

export enum ThemeCode {
  Light = "light",
  Dark = "dark",
  AIBox = "aibox",
  Somedia = "somedia",
  Weihnachtsmann = "weihnachtsmann",
  SunriseBusiness = "sunriseBusiness",
  SunriseBusinessAlt = "sunrise-business",
  AIBoxHome = "aiboxHome",
}

export const ThemeMap: Record<ThemeCode, any> = {
  [ThemeCode.Light]: { title: "Light", value: ThemeCode.Light },
  [ThemeCode.Dark]: { title: "Dark", value: ThemeCode.Dark },
  [ThemeCode.AIBox]: { title: "aibox", value: ThemeCode.AIBox },
  [ThemeCode.Somedia]: { title: "Somedia", value: ThemeCode.Somedia },
  [ThemeCode.Weihnachtsmann]: { title: "Weihnachtsmann", value: ThemeCode.Weihnachtsmann },
  [ThemeCode.SunriseBusiness]: { title: "Sunrise Business (Red)", value: ThemeCode.SunriseBusiness },
  [ThemeCode.SunriseBusinessAlt]: { title: "Sunrise Business", value: ThemeCode.SunriseBusinessAlt },
  [ThemeCode.AIBoxHome]: { title: "aibox Home", value: ThemeCode.AIBoxHome },
};

export const Themes = [
  ThemeMap[ThemeCode.Light], ThemeMap[ThemeCode.Dark], ThemeMap[ThemeCode.AIBox], ThemeMap[ThemeCode.Somedia], ThemeMap[ThemeCode.SunriseBusiness], ThemeMap[ThemeCode.SunriseBusinessAlt], ThemeMap[ThemeCode.AIBoxHome]
]