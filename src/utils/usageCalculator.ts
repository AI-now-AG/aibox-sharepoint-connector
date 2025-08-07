import { useTranslations } from "$i18n/utils";
import { type Tenant } from "$data/models/tenant.model";
import { type UsageLog } from "$data/models/usageLog.model";
import { ApiKeyProvider } from "$types/TenantFeature";
import {
  TextModel,
  AudioModel,
  ImageModel,
  WebsearchModel,
  type UsageRow,
  type UsageItem,
  type TokenCreditRate,
} from "$types/UsageTracking";

const t = useTranslations();

const unitLabels: Record<string, string> = {
  tokens: t("usage.units.tokens"),
  requests: t("usage.units.requests"),
  images: t("usage.units.images"),
  minutes: t("usage.units.minutes"),
  credits: t("usage.units.credits"),
};

/**
 * Mapping configuration for each provider with input and output rates:
 *
 *  Format: provider => requests (per 1 credit)
 *
 *  Example:
 *      + OpenAI gpt-4o: 40000 input tokens = 1 request
 *      + OpenAI gpt-4o: 10000 output tokens = 1 request
 */
const TOKEN_CREDIT_MAPPING: Record<string, TokenCreditRate> = {
  [ApiKeyProvider.OpenAI]: { input: 40000, output: 10000 },
  [ApiKeyProvider.AzureOpenAI]: { input: 40000, output: 10000 },
  [ApiKeyProvider.Perplexity]: { input: 100000, output: 100000 },
  [ApiKeyProvider.Claude]: { input: 33000, output: 6500 },
};

/**
 * Mapping configuration for each provider with request rates.
 *
 * Format: provider => requests per 1 credit
 *
 * Examples:
 *   - DALLE: 1 credit = 1 request
 *   - GPT image: 1 credit = 0.33 request
 *   - Flux: 1 credit = 2 requests
 *   - Perplexity: 1 credit = 12 requests
 */
const REQUEST_CREDIT_MAPPING: Record<string, number> = {
  [ImageModel.Dalle]: 1,
  [ImageModel.GptImage]: 0.33,
  [ImageModel.FluxDev]: 2,
  [WebsearchModel.Sonar]: 12,
};

/**
 * Mapping configuration for each provider with duration rates.
 *
 * Format: model => minutes per 1 credit
 *
 * Examples:
 *   - Whisper: 1 credit = 15 minutes
 *   - Audio Pro: 1 credit = 30 minutes
 */
const DURATION_CREDIT_MAPPING: Record<string, number> = {
  [AudioModel.Whisper]: 15,
  [AudioModel.AudioPro]: 30,
  [AudioModel.ElevenLabs]: 10,
};

const _tokensToCredits = (
  provider: ApiKeyProvider,
  inputTokens: number = 0,
  outputTokens: number = 0,
): Record<string, number> => {
  const rates = TOKEN_CREDIT_MAPPING[provider.toLowerCase()];
  if (!rates) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  // Calculate credits separately for input and output tokens
  const inputCredits = Math.ceil(inputTokens / rates.input);
  const outputCredits = Math.ceil(outputTokens / rates.output);

  // Total credits is the sum of input and output credits
  return {
    inputCredits,
    outputCredits,
  };
};

const _requestsToCredits = (
  model: ImageModel | WebsearchModel,
  requests: number,
): number => {
  const rate = REQUEST_CREDIT_MAPPING[model.toLowerCase()];
  if (!rate) {
    throw new Error(`Unknown model: ${model}`);
  }

  // Calculate credits
  return Math.ceil(requests / rate);
};

const _durationsToCredits = (
  ttsModel: AudioModel,
  durationSeconds: number,
): number => {
  const rate = DURATION_CREDIT_MAPPING[ttsModel];
  if (!rate) {
    throw new Error(`Unknown model: ${ttsModel}`);
  }

  // Calculate credits
  // durations is milliseconds
  const minutes = Math.ceil(durationSeconds / 60);
  return Math.ceil(minutes / rate);
};

const _skipUsageIfPrivateKeyUsed = (
  usageItems: UsageItem[],
  usePrivateKey: boolean,
) => {
  return usageItems.map((item) => {
    item.private = usePrivateKey;
    if (usePrivateKey) {
      item.credits = 0;
    }
    return item;
  });
};

const _calculateOpenAIUsage = (
  rawUsages: UsageLog[],
  usePrivateKey: boolean,
) => {
  const usageItems: UsageItem[] = [];

  const usageData = rawUsages.filter((item: UsageLog) => {
    return item.provider == ApiKeyProvider.OpenAI;
  });

  // gpt-4o
  const gpt4oItems = usageData.filter(
    (item: UsageLog) => item.model == TextModel.Gpt4o,
  );
  const gpt4oInputTokens = gpt4oItems.reduce(
    (sum: number, item: UsageLog) => sum + (item.input_tokens ?? 0),
    0,
  );
  const gpt4oOutputTokens = gpt4oItems.reduce(
    (sum: number, item: UsageLog) => sum + (item.output_tokens ?? 0),
    0,
  );
  const { inputCredits: gpt4oInputCredits, outputCredits: gpt4oOutputCredits } =
    _tokensToCredits(
      ApiKeyProvider.OpenAI,
      gpt4oInputTokens,
      gpt4oOutputTokens,
    );
  usageItems.push({
    model: "gpt-4o Input",
    amount: gpt4oInputTokens,
    unit: unitLabels.tokens,
    credits: gpt4oInputCredits,
  });
  usageItems.push({
    model: "gpt-4o Output",
    amount: gpt4oOutputTokens,
    unit: unitLabels.tokens,
    credits: gpt4oOutputCredits,
  });

  // DALL-E
  const dalleItems = usageData.filter(
    (item: UsageLog) => item.model == ImageModel.Dalle,
  );
  const dalleRequests = dalleItems.length;
  usageItems.push({
    model: "DALL-E",
    amount: dalleRequests,
    unit: unitLabels.images,
    credits: _requestsToCredits(ImageModel.Dalle, dalleRequests),
  });

  // GPT Image
  const gptImageItems = usageData.filter(
    (item: UsageLog) => item.model == ImageModel.GptImage,
  );
  const gptImageRequests = gptImageItems.length;
  usageItems.push({
    model: "GPT Image",
    amount: gptImageRequests,
    unit: unitLabels.images,
    credits: _requestsToCredits(ImageModel.GptImage, gptImageRequests),
  });

  return _skipUsageIfPrivateKeyUsed(usageItems, usePrivateKey);
};

const _calculateAzureOpenAIUsage = (
  rawUsages: UsageLog[],
  usePrivateKey: boolean,
) => {
  const usageItems: UsageItem[] = [];

  const usageData = rawUsages.filter((item: UsageLog) => {
    return item.provider == ApiKeyProvider.AzureOpenAI;
  });

  // gpt-4o
  const gpt4oItems = usageData.filter(
    (item: UsageLog) => item.model == "gpt-4o",
  );
  const gpt4oInputTokens = gpt4oItems.reduce(
    (sum: number, item: UsageLog) => sum + (item.input_tokens ?? 0),
    0,
  );
  const gpt4oOutputTokens = gpt4oItems.reduce(
    (sum: number, item: UsageLog) => sum + (item.output_tokens ?? 0),
    0,
  );
  const { inputCredits: gpt4oInputCredits, outputCredits: gpt4oOutputCredits } =
    _tokensToCredits(
      ApiKeyProvider.AzureOpenAI,
      gpt4oInputTokens,
      gpt4oOutputTokens,
    );
  usageItems.push({
    model: "gpt-4o Input",
    amount: gpt4oInputTokens,
    unit: unitLabels.tokens,
    credits: gpt4oInputCredits,
  });
  usageItems.push({
    model: "gpt-4o Output",
    amount: gpt4oOutputTokens,
    unit: unitLabels.tokens,
    credits: gpt4oOutputCredits,
  });

  return _skipUsageIfPrivateKeyUsed(usageItems, usePrivateKey);
};

const _calculatePerplexityUsage = (
  rawUsages: UsageLog[],
  usePrivateKey: boolean,
) => {
  const usageItems: UsageItem[] = [];

  const usageData = rawUsages.filter((item: UsageLog) => {
    return item.provider == ApiKeyProvider.Perplexity;
  });

  // sonar
  const sonarItems = usageData.filter(
    (item: UsageLog) => item.model == WebsearchModel.Sonar,
  );
  const sonarInputTokens = sonarItems.reduce(
    (sum: number, item: UsageLog) => sum + (item.input_tokens ?? 0),
    0,
  );
  const sonarOutputTokens = sonarItems.reduce(
    (sum: number, item: UsageLog) => sum + (item.output_tokens ?? 0),
    0,
  );
  const totalTokens = sonarInputTokens + sonarOutputTokens;
  const { inputCredits: sonarInOutCredits } = _tokensToCredits(
    ApiKeyProvider.Perplexity,
    totalTokens,
  );
  usageItems.push({
    model: "sonar Input/Output",
    amount: sonarInputTokens + sonarOutputTokens,
    unit: unitLabels.tokens,
    credits: sonarInOutCredits,
  });

  const sonarRequests = sonarItems.length;
  usageItems.push({
    model: "Sonar medium",
    amount: sonarRequests,
    unit: unitLabels.requests,
    credits: _requestsToCredits(WebsearchModel.Sonar, sonarRequests),
  });

  return _skipUsageIfPrivateKeyUsed(usageItems, usePrivateKey);
};

const _calculateClaudeUsage = (
  rawUsages: UsageLog[],
  usePrivateKey: boolean,
) => {
  const usageItems: UsageItem[] = [];

  const usageData = rawUsages.filter((item: UsageLog) => {
    return item.provider == ApiKeyProvider.Claude;
  });

  // sonnet
  const sonnetItems = usageData.filter(
    (item: UsageLog) => item.model == TextModel.ClaudeSonnet,
  );
  const sonnetInputTokens = sonnetItems.reduce(
    (sum: number, item: UsageLog) => sum + (item.input_tokens ?? 0),
    0,
  );
  const sonnetOutputTokens = sonnetItems.reduce(
    (sum: number, item: UsageLog) => sum + (item.output_tokens ?? 0),
    0,
  );
  const {
    inputCredits: sonnetInputCredits,
    outputCredits: sonnetOutputCredits,
  } = _tokensToCredits(
    ApiKeyProvider.Claude,
    sonnetInputTokens,
    sonnetOutputTokens,
  );
  usageItems.push({
    model: "sonnet Input",
    amount: sonnetInputTokens,
    unit: unitLabels.tokens,
    credits: sonnetInputCredits,
  });
  usageItems.push({
    model: "sonnet Output",
    amount: sonnetOutputTokens,
    unit: unitLabels.tokens,
    credits: sonnetOutputCredits,
  });

  return _skipUsageIfPrivateKeyUsed(usageItems, usePrivateKey);
};

const _calculateAudioUsage = (
  rawUsages: UsageLog[],
  useAzureOpenAIPrivateKey: boolean,
  useSpeechPrivateKey: boolean,
  useElevenLabsPrivateKey: boolean,
) => {
  const usageData = rawUsages.filter((item: UsageLog) => {
    return (
      item.provider == ApiKeyProvider.AzureOpenAI ||
      item.provider == ApiKeyProvider.ElevenLabs
    );
  });

  // Whisper
  const whisperItems = usageData.filter(
    (item: UsageLog) => item.model == AudioModel.Whisper,
  );
  const whisperDurations = whisperItems.reduce(
    (sum: number, item: UsageLog) => sum + (item.duration ?? 0),
    0,
  );
  const whisperUsageItem: UsageItem = {
    model: "Whisper",
    amount: Math.ceil(whisperDurations / 60), // seconds to minutes
    unit: unitLabels.minutes,
    credits: _durationsToCredits(AudioModel.Whisper, whisperDurations),
  };

  // Audio Pro
  const audioProItems = usageData.filter(
    (item: UsageLog) => item.model == AudioModel.AudioPro,
  );
  const audioProDurations = audioProItems.reduce(
    (sum: number, item: UsageLog) => sum + (item.duration ?? 0),
    0,
  );
  const speechUsageItem: UsageItem = {
    model: "Audio Pro",
    amount: Math.ceil(audioProDurations / 60000), // milliseconds to minutes
    unit: unitLabels.minutes,
    credits: _durationsToCredits(AudioModel.AudioPro, audioProDurations / 1000),
  };

  // ElevenLabs
  const elevenLabsItems = usageData.filter(
    (item: UsageLog) => item.model == AudioModel.ElevenLabs,
  );
  console.log(`ElevenLabs items: ${elevenLabsItems.length}`);
  const elevenLabsDurations = elevenLabsItems.reduce(
    (sum: number, item: UsageLog) => sum + (item.duration ?? 0),
    0,
  );
  console.log(`ElevenLabs durations: ${elevenLabsDurations} seconds`);
  const elevenLabsUsageItem: UsageItem = {
    model: "ElevenLabs",
    amount: Math.ceil(elevenLabsDurations / 60), // seconds to minutes
    unit: unitLabels.minutes,
    credits: _durationsToCredits(AudioModel.ElevenLabs, elevenLabsDurations),
  };
  console.log(`ElevenLabs usage item: ${JSON.stringify(elevenLabsUsageItem)}`);

  const whisperUsageItems = _skipUsageIfPrivateKeyUsed(
    [whisperUsageItem],
    useAzureOpenAIPrivateKey,
  );
  const speechUsageItems = _skipUsageIfPrivateKeyUsed(
    [speechUsageItem],
    useSpeechPrivateKey,
  );

  const elevenLabsUsageItems = _skipUsageIfPrivateKeyUsed(
    [elevenLabsUsageItem],
    useElevenLabsPrivateKey,
  );
  return [...whisperUsageItems, ...speechUsageItems, ...elevenLabsUsageItems];
};

const _calculateFluxUsage = (rawUsages: UsageLog[], usePrivateKey: boolean) => {
  const usageItems: UsageItem[] = [];

  const usageData = rawUsages.filter((item: UsageLog) => {
    return item.provider == ApiKeyProvider.Flux;
  });

  // Flux-dev
  const fluxItems = usageData.filter(
    (item: UsageLog) => item.model == ImageModel.FluxDev,
  );
  const fluxRequests = fluxItems.length;
  usageItems.push({
    model: "Flux-dev",
    amount: fluxRequests,
    unit: unitLabels.images,
    credits: _requestsToCredits(ImageModel.FluxDev, fluxRequests),
  });

  return _skipUsageIfPrivateKeyUsed(usageItems, usePrivateKey);
};

export const calculateUsage = (tenant: Tenant, rawUsages: UsageLog[]) => {
  const usageData: UsageRow[] = [];

  // OpenAI
  const useOpenAIPrivateKey = tenant.metadata?.openaiPrivateKeyEnabled ?? false;
  usageData.push({
    provider: "OpenAI",
    details: _calculateOpenAIUsage(rawUsages, useOpenAIPrivateKey),
  });

  // AzureOpenAI
  const useAzureOpenAIPrivateKey =
    tenant.metadata?.azureOpenaiPrivateKeyEnabled ?? false;
  usageData.push({
    provider: "Azure OpenAI",
    details: _calculateAzureOpenAIUsage(rawUsages, useAzureOpenAIPrivateKey),
  });

  // Perplexity
  const usePerplexityPrivateKey =
    tenant.metadata?.perplexityPrivateKeyEnabled ?? false;
  usageData.push({
    provider: "Perplexity",
    details: _calculatePerplexityUsage(rawUsages, usePerplexityPrivateKey),
  });

  // Claude
  const useClaudePrivateKey = tenant.metadata?.claudePrivateKeyEnabled ?? false;
  usageData.push({
    provider: "Claude",
    details: _calculateClaudeUsage(rawUsages, useClaudePrivateKey),
  });

  // Audio
  const useSpeechPrivateKey = tenant.metadata?.speechPrivateKeyEnabled ?? false;
  const useElevenLabsPrivateKey =
    tenant.metadata?.elevenLabsPrivateKeyEnabled ?? false;
  usageData.push({
    provider: "Audio",
    details: _calculateAudioUsage(
      rawUsages,
      useAzureOpenAIPrivateKey,
      useSpeechPrivateKey,
      useElevenLabsPrivateKey,
    ),
  });

  // const useElevenLabsPrivateKey = tenant.metadata?.elevenLabsPrivateKeyEnabled ?? false;
  // usageData.push({
  //   provider: "Audio",
  //   details: _calculateAudioUsage(
  //     rawUsages,
  //     useAzureOpenAIPrivateKey,
  //     useSpeechPrivateKey,
  //   ),
  // });

  // Flux
  const useFluxPrivateKey = tenant.metadata?.fluxPrivateKeyEnabled ?? false;
  usageData.push({
    provider: "Flux",
    details: _calculateFluxUsage(rawUsages, useFluxPrivateKey),
  });

  return usageData;
};

export const sumCreditsUsed = (usageData: UsageRow[]): number => {
  return usageData.reduce(
    (total: number, item) =>
      total +
      item.details.reduce((subTotal, _item) => subTotal + _item.credits, 0),
    0,
  );
};
