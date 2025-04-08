import { type UsageLog } from "$data/models/usageLog.model";
import { ApiKeyProvider, AzureTTSModel } from "$types/TenantFeature";
import type {
  UsageRow,
  UsageItem,
  TokenCreditRate,
} from "$types/UsageTracking";

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
};

/**
 * Mapping configuration for each provider with request rates.
 *
 * Format: provider => requests per 1 credit
 *
 * Examples:
 *   - DALLE: 1 credit = 1 request
 *   - Flux: 1 credit = 2 requests
 *   - Flux: 1 credit = 12 requests
 */
const REQUEST_CREDIT_MAPPING: Record<string, number> = {
  [ApiKeyProvider.OpenAI]: 1,
  [ApiKeyProvider.Flux]: 2,
  [ApiKeyProvider.Perplexity]: 12,
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
  [AzureTTSModel.Whisper]: 15,
  [AzureTTSModel.AudioPro]: 30,
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
  provider: ApiKeyProvider,
  requests: number,
): number => {
  const rate = REQUEST_CREDIT_MAPPING[provider.toLowerCase()];
  if (!rate) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  // Calculate credits
  return Math.ceil(requests / rate);
};

const _durationsToCredits = (
  ttsModel: AzureTTSModel,
  durations: number,
): number => {
  const rate = DURATION_CREDIT_MAPPING[ttsModel];
  if (!rate) {
    throw new Error(`Unknown model: ${ttsModel}`);
  }

  // Calculate credits
  // durations is milliseconds
  const minutes = Math.ceil(durations / 60000);
  return Math.ceil(minutes / rate);
};

const _calculateOpenAIUsage = (rawUsages: UsageLog[]) => {
  const usageItems: UsageItem[] = [];

  const usageData = rawUsages.filter((item: UsageLog) => {
    return item.provider == ApiKeyProvider.OpenAI;
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
      ApiKeyProvider.OpenAI,
      gpt4oInputTokens,
      gpt4oOutputTokens,
    );
  usageItems.push({
    model: "gpt-4o Input",
    amount: gpt4oInputTokens,
    unit: "tokens",
    credits: gpt4oInputCredits,
  });
  usageItems.push({
    model: "gpt-4o Output",
    amount: gpt4oOutputTokens,
    unit: "tokens",
    credits: gpt4oOutputCredits,
  });

  // DALL-E
  const dalleItems = usageData.filter(
    (item: UsageLog) => item.model == "dall-e-3",
  );
  const dalleRequests = dalleItems.length;
  usageItems.push({
    model: "DALL-E",
    amount: dalleRequests,
    unit: "calls",
    credits: _requestsToCredits(ApiKeyProvider.OpenAI, dalleRequests),
  });

  return usageItems;
};

const _calculateAzureOpenAIUsage = (rawUsages: UsageLog[]) => {
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
    unit: "tokens",
    credits: gpt4oInputCredits,
  });
  usageItems.push({
    model: "gpt-4o Output",
    amount: gpt4oOutputTokens,
    unit: "tokens",
    credits: gpt4oOutputCredits,
  });

  return usageItems;
};

const _calculatePerplexityUsage = (rawUsages: UsageLog[]) => {
  const usageItems: UsageItem[] = [];

  const usageData = rawUsages.filter((item: UsageLog) => {
    return item.provider == ApiKeyProvider.Perplexity;
  });

  // sonar
  const sonarItems = usageData.filter(
    (item: UsageLog) => item.model == "sonar",
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
    unit: "tokens",
    credits: sonarInOutCredits,
  });

  const sonarRequests = sonarItems.length;
  usageItems.push({
    model: "Sonar low / legacy pricing",
    amount: sonarRequests,
    unit: "calls",
    credits: _requestsToCredits(ApiKeyProvider.Perplexity, sonarRequests),
  });

  return usageItems;
};

const _calculateAudioUsage = (rawUsages: UsageLog[]) => {
  const usageItems: UsageItem[] = [];

  const usageData = rawUsages.filter((item: UsageLog) => {
    return item.provider == ApiKeyProvider.AzureOpenAI;
  });

  // Whisper
  const whisperItems = usageData.filter(
    (item: UsageLog) => item.model == AzureTTSModel.Whisper,
  );
  const whisperDurations = whisperItems.reduce(
    (sum: number, item: UsageLog) => sum + (item.duration ?? 0),
    0,
  );
  usageItems.push({
    model: "Whisper",
    amount: Math.ceil(whisperDurations / 60000),
    unit: "minutes",
    credits: _durationsToCredits(AzureTTSModel.Whisper, whisperDurations),
  });

  // Audio Pro
  const audioProItems = usageData.filter(
    (item: UsageLog) => item.model == AzureTTSModel.AudioPro,
  );
  const audioProDurations = audioProItems.reduce(
    (sum: number, item: UsageLog) => sum + (item.duration ?? 0),
    0,
  );
  usageItems.push({
    model: "Audio Pro",
    amount: Math.ceil(audioProDurations / 60000),
    unit: "minutes",
    credits: _durationsToCredits(AzureTTSModel.AudioPro, audioProDurations),
  });

  return usageItems;
};

const _calculateFluxUsage = (rawUsages: UsageLog[]) => {
  const usageItems: UsageItem[] = [];

  const usageData = rawUsages.filter((item: UsageLog) => {
    return item.provider == ApiKeyProvider.Flux;
  });

  // Flux-dev
  const fluxItems = usageData.filter(
    (item: UsageLog) => item.model == "fal-ai/flux/dev",
  );
  const fluxRequests = fluxItems.length;
  usageItems.push({
    model: "Flux-dev",
    amount: fluxRequests,
    unit: "calls",
    credits: _requestsToCredits(ApiKeyProvider.Flux, fluxRequests),
  });

  return usageItems;
};

export const calculateUsage = (rawUsages: UsageLog[]) => {
  const usageData: UsageRow[] = [];

  // OpenAI
  usageData.push({
    provider: "OpenAI",
    details: _calculateOpenAIUsage(rawUsages),
  });

  // AzureOpenAI
  usageData.push({
    provider: "Azure OpenAI",
    details: _calculateAzureOpenAIUsage(rawUsages),
  });

  // Perplexity
  usageData.push({
    provider: "Perplexity",
    details: _calculatePerplexityUsage(rawUsages),
  });

  // Audio
  usageData.push({
    provider: "Audio",
    details: _calculateAudioUsage(rawUsages),
  });

  // Flux
  usageData.push({
    provider: "Flux",
    details: _calculateFluxUsage(rawUsages),
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
