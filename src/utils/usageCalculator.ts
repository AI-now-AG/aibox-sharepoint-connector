import { type UsageLog } from "$data/models/usageLog.model";
import { ApiKeyProvider } from "$types/TenantFeature";
import type {
  UsageRow,
  UsageItem,
  TokenCreditRate,
  RequestCreditRate,
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
 */
const REQUEST_CREDIT_MAPPING: Record<string, RequestCreditRate> = {
  [ApiKeyProvider.OpenAI]: 1,
  [ApiKeyProvider.Flux]: 2,
  [ApiKeyProvider.Perplexity]: 12,
};

const _tokensToCredits = (
  provider: ApiKeyProvider,
  inputTokens: number,
  outputTokens: number,
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

  // Calculate credits separately for input and output tokens
  const credits = Math.ceil(requests / rate);

  // Total credits is the sum of input and output credits
  return credits;
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
    (sum: number, item: UsageLog) => sum + item.input_tokens,
    0,
  );
  const gpt4oOutputTokens = gpt4oItems.reduce(
    (sum: number, item: UsageLog) => sum + item.output_tokens,
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
    (sum: number, item: UsageLog) => sum + item.input_tokens,
    0,
  );
  const gpt4oOutputTokens = gpt4oItems.reduce(
    (sum: number, item: UsageLog) => sum + item.output_tokens,
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

  // Whisper
  usageItems.push({
    model: "Whisper",
    amount: 0,
    unit: "minutes",
    credits: 0,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // Flux
  usageData.push({
    provider: "Flux",
    details: _calculateFluxUsage(rawUsages),
  });

  return usageData;
};
