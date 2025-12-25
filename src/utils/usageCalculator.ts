import { useTranslations } from "$i18n/utils";
import { type Tenant } from "$data/models/tenant.model";
import { type UsageLog } from "$data/models/usageLog.model";
import { ApiKeyProvider, TenantFeature } from "$types/TenantFeature";
import {
  TextModel,
  AudioModel,
  ImageModel,
  WebsearchModel,
  EmbeddingModel,
  type UsageRow,
  type UsageItem,
  type TokenCreditRate,
} from "$types/UsageTracking";
import { ModelName } from "$types/AIProvider";

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
 *      + OpenAI gpt-5: 80000 input tokens = 1 request
 *      + OpenAI gpt-5: 10000 output tokens = 1 request
 */
const TOKEN_CREDIT_MAPPING: Record<string, TokenCreditRate> = {
  [ApiKeyProvider.OpenAI]: { input: 40000, output: 10000 },
  [ApiKeyProvider.OpenAIGpt5]: { input: 80000, output: 10000 },
  [ApiKeyProvider.AzureOpenAI]: { input: 40000, output: 10000 },
  [ApiKeyProvider.Perplexity]: { input: 100000, output: 100000 },
  [ApiKeyProvider.Claude]: { input: 33000, output: 6500 },
  [ApiKeyProvider.Gemini]: { input: 330000, output: 40000 },
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
 *   - Gemini: 1 credit = 2 webserch requests
 *   - Gemini: 1 credit = 2 images
 */
const REQUEST_CREDIT_MAPPING: Record<string, number> = {
  [ModelName.Dalle]: 1,
  [ModelName.GptImage]: 0.33,
  [ModelName.FluxDev]: 2,
  [ModelName.Sonar]: 12,
  [ModelName.Gemini25Flash]: 2,
  [ModelName.Gemini25FlashImage]: 2,
  [ModelName.Gemini3ProImage]: 0.75,
  [ModelName.Gpt4o]: 10,
  [ModelName.Gpt5]: 10,
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

/**
 * Mapping configuration for embedding models with token rates.
 *
 * Format: model => tokens per 1 credit
 *
 * Examples:
 *   - text-embedding-3-small: 1 credit = 500,000 tokens
 *   - text-embedding-3-large: 1 credit = 200,000 tokens
 *   - text-embedding-ada-002: 1 credit = 1,000,000 tokens
 *   - text-embedding-004: 1 credit = 500,000 tokens
 */
const EMBEDDING_TOKEN_CREDIT_MAPPING: Record<string, number> = {
  [EmbeddingModel.TextEmbedding3Small]: 500000,
  [EmbeddingModel.TextEmbedding3Large]: 200000,
  [EmbeddingModel.TextEmbeddingAda002]: 1000000,
  [EmbeddingModel.TextEmbedding004]: 500000,
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
  model: ImageModel | WebsearchModel | ModelName,
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

const _embeddingTokensToCredits = (
  model: string,
  tokens: number,
): number => {
  const rate = EMBEDDING_TOKEN_CREDIT_MAPPING[model.toLowerCase()];
  if (!rate) {
    // Default rate for unknown models
    return Math.ceil(tokens / 500000);
  }
  return Math.ceil(tokens / rate);
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
    (item: UsageLog) => item.model == ModelName.Gpt4o,
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

  const openAiWebsearchRequests = gpt4oItems.reduce(
    (sum: number, item: UsageLog) =>
      sum + (item.metadata?.websearch_count ?? 0),
    0,
  );

  usageItems.push({
    model: "gpt-4o Websearch",
    amount: openAiWebsearchRequests,
    unit: unitLabels.requests,
    credits: _requestsToCredits(
      ModelName.Gpt4o,
      openAiWebsearchRequests,
    ),
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

const _calculateOpenAIGpt5Usage = (
  rawUsages: UsageLog[],
  usePrivateKey: boolean,
) => {
  const usageItems: UsageItem[] = [];

  const usageData = rawUsages.filter((item: UsageLog) => {
    return item.provider == ApiKeyProvider.OpenAIGpt5;
  });

  // // gpt-5
  // const gpt5Items = usageData.filter(
  //   (item: UsageLog) => item.model == ModelName.Gpt5Old,
  // );
  // const gpt5InputTokens = gpt5Items.reduce(
  //   (sum: number, item: UsageLog) => sum + (item.input_tokens ?? 0),
  //   0,
  // );
  // const gpt5OutputTokens = gpt5Items.reduce(
  //   (sum: number, item: UsageLog) => sum + (item.output_tokens ?? 0),
  //   0,
  // );
  // const { inputCredits: gpt5InputCredits, outputCredits: gpt5OutputCredits } =
  //   _tokensToCredits(
  //     ApiKeyProvider.OpenAIGpt5,
  //     gpt5InputTokens,
  //     gpt5OutputTokens,
  //   );
  // usageItems.push({
  //   model: "gpt-5 Input",
  //   amount: gpt5InputTokens,
  //   unit: unitLabels.tokens,
  //   credits: gpt5InputCredits,
  // });
  // usageItems.push({
  //   model: "gpt-5 Output",
  //   amount: gpt5OutputTokens,
  //   unit: unitLabels.tokens,
  //   credits: gpt5OutputCredits,
  // });

  // const openAiWebsearchRequests = gpt5Items.reduce(
  //   (sum: number, item: UsageLog) =>
  //     sum + (item.metadata?.websearch_count ?? 0),
  //   0,
  // );

  // usageItems.push({
  //   model: "gpt-5 Websearch",
  //   amount: openAiWebsearchRequests,
  //   unit: unitLabels.requests,
  //   credits: _requestsToCredits(
  //     ModelName.Gpt5,
  //     openAiWebsearchRequests,
  //   ),
  // });


  // gpt-5.1
  const gpt51Items = usageData.filter(
    (item: UsageLog) => item.model == ModelName.Gpt5 || item.model == ModelName.Gpt5Old,
  );
  const gpt51InputTokens = gpt51Items.reduce(
    (sum: number, item: UsageLog) => sum + (item.input_tokens ?? 0),
    0,
  );
  const gpt51OutputTokens = gpt51Items.reduce(
    (sum: number, item: UsageLog) => sum + (item.output_tokens ?? 0),
    0,
  );
  const { inputCredits: gpt51InputCredits, outputCredits: gpt51OutputCredits } =
    _tokensToCredits(
      ApiKeyProvider.OpenAIGpt5,
      gpt51InputTokens,
      gpt51OutputTokens,
    );
  usageItems.push({
    model: "gpt-5.1 Input",
    amount: gpt51InputTokens,
    unit: unitLabels.tokens,
    credits: gpt51InputCredits,
  });
  usageItems.push({
    model: "gpt-5.1 Output",
    amount: gpt51OutputTokens,
    unit: unitLabels.tokens,
    credits: gpt51OutputCredits,
  });

  const openAi51WebsearchRequests = gpt51Items.reduce(
    (sum: number, item: UsageLog) =>
      sum + (item.metadata?.websearch_count ?? 0),
    0,
  );

  usageItems.push({
    model: "gpt-5.1 Websearch",
    amount: openAi51WebsearchRequests,
    unit: unitLabels.requests,
    credits: _requestsToCredits(
      ModelName.Gpt5,
      openAi51WebsearchRequests,
    ),
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

const _calculateGeminiUsage = (
  rawUsages: UsageLog[],
  usePrivateKey: boolean,
) => {
  const usageItems: UsageItem[] = [];

  const usageData = rawUsages.filter((item: UsageLog) => {
    return item.provider == ApiKeyProvider.Gemini;
  });

  // gemini
  const geminiItems = usageData.filter(
    (item: UsageLog) => item.model == TextModel.Gemini,
  );
  const geminiInputTokens = geminiItems.reduce(
    (sum: number, item: UsageLog) => sum + (item.input_tokens ?? 0),
    0,
  );
  const geminiOutputTokens = geminiItems.reduce(
    (sum: number, item: UsageLog) => sum + (item.output_tokens ?? 0),
    0,
  );
  const geminiWebsearchRequests = geminiItems.reduce(
    (sum: number, item: UsageLog) =>
      sum + (item.metadata?.websearch_count ?? 0),
    0,
  );
  const {
    inputCredits: geminiInputCredits,
    outputCredits: geminiOutputCredits,
  } = _tokensToCredits(
    ApiKeyProvider.Gemini,
    geminiInputTokens,
    geminiOutputTokens,
  );

  usageItems.push({
    model: "gemini Input",
    amount: geminiInputTokens,
    unit: unitLabels.tokens,
    credits: geminiInputCredits,
  });

  usageItems.push({
    model: "gemini Output",
    amount: geminiOutputTokens,
    unit: unitLabels.tokens,
    credits: geminiOutputCredits,
  });

  usageItems.push({
    model: "gemini Websearch",
    amount: geminiWebsearchRequests,
    unit: unitLabels.requests,
    credits: _requestsToCredits(
      ModelName.Gemini25Flash,
      geminiWebsearchRequests,
    ),
  });

  // Gemini 2.5 Flash Image
  const geminiImageItems = usageData.filter(
    (item: UsageLog) => { return item.model == ModelName.Gemini25FlashImage && item.type == "image" },
  );
  const geminiImageRequests = geminiImageItems.length;
  usageItems.push({
    model: "gemini 2.5 Flash Image",
    amount: geminiImageRequests,
    unit: unitLabels.images,
    credits: _requestsToCredits(
      ModelName.Gemini25FlashImage,
      geminiImageRequests
    ),
  });

  // Gemini 3.0 Pro Image
  const gemini3ProImageItems = usageData.filter(
    (item: UsageLog) => { return item.model == ModelName.Gemini3ProImage && item.type == "image" },
  );
  const gemini3ProImageRequests = gemini3ProImageItems.length;
  usageItems.push({
    model: "gemini 3 Pro Image",
    amount: gemini3ProImageRequests,
    unit: unitLabels.images,
    credits: _requestsToCredits(
      ModelName.Gemini3ProImage,
      gemini3ProImageRequests
    ),
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

const _calculateEmbeddingUsage = (rawUsages: UsageLog[]) => {
  const usageItems: UsageItem[] = [];

  // Filter embedding type usage logs
  const usageData = rawUsages.filter((item: UsageLog) => {
    return item.type === "embedding";
  });

  // Group by model
  const modelGroups: Record<string, { tokens: number; count: number }> = {};

  usageData.forEach((item: UsageLog) => {
    const model = item.model || "unknown";
    if (!modelGroups[model]) {
      modelGroups[model] = { tokens: 0, count: 0 };
    }
    modelGroups[model].tokens += item.input_tokens ?? 0;
    modelGroups[model].count += 1;
  });

  // Create usage items for each model
  Object.entries(modelGroups).forEach(([model, data]) => {
    usageItems.push({
      model: model,
      amount: data.tokens,
      unit: unitLabels.tokens,
      credits: _embeddingTokensToCredits(model, data.tokens),
    });
  });

  return usageItems;
};

export const calculateUsage = (tenant: Tenant, rawUsages: UsageLog[]) => {
  const usageData: UsageRow[] = [];

  const isProviderActive = (
    providerName: ApiKeyProvider
  ): boolean => {
    return (tenant.api_key_providers ?? []).some(
      p => (p.name?.toString()?.toLowerCase() === providerName.toString()?.toLowerCase()) && p.active == true
    );
  }

  const isFeatureActive = (
    providerName: ApiKeyProvider
  ): boolean => {
    return (tenant.included_features ?? []).some(
      p => p.provider?.toString()?.toLowerCase() === providerName.toString()?.toLowerCase()
    );
  }

  const isAudioActive = (
    providerName: ApiKeyProvider
  ): boolean => {
    return (tenant.included_features ?? []).some(
      p => (p.provider?.toString()?.toLowerCase() == providerName.toString()?.toLowerCase()) && p.name == TenantFeature.AudioToText
    );
  }

  // OpenAI
  const useOpenAIPrivateKey = tenant.metadata?.openaiPrivateKeyEnabled ?? false;
  if (isProviderActive(ApiKeyProvider.OpenAI)) {
    usageData.push({
      provider: "OpenAI",
      details: _calculateOpenAIUsage(rawUsages, useOpenAIPrivateKey),
    });
  }

  // OpenAI GPT5
  const useOpenAIGpt5PrivateKey =
    tenant.metadata?.openaiGpt5PrivateKeyEnabled ?? false;
  if (isProviderActive(ApiKeyProvider.OpenAIGpt5)) {
    usageData.push({
      provider: "OpenAI GPT-5.1",
      details: _calculateOpenAIGpt5Usage(rawUsages, useOpenAIGpt5PrivateKey),
    });
  }

  // AzureOpenAI
  const useAzureOpenAIPrivateKey =
    tenant.metadata?.azureOpenaiPrivateKeyEnabled ?? false;
  if (isProviderActive(ApiKeyProvider.AzureOpenAI)) {
    usageData.push({
      provider: "Azure OpenAI",
      details: _calculateAzureOpenAIUsage(rawUsages, useAzureOpenAIPrivateKey),
    });
  }

  // Perplexity
  const usePerplexityPrivateKey =
    tenant.metadata?.perplexityPrivateKeyEnabled ?? false;
  if (isProviderActive(ApiKeyProvider.Perplexity)) {
    usageData.push({
      provider: "Perplexity",
      details: _calculatePerplexityUsage(rawUsages, usePerplexityPrivateKey),
    });
  }

  // Claude
  const useClaudePrivateKey = tenant.metadata?.claudePrivateKeyEnabled ?? false;
  if (isProviderActive(ApiKeyProvider.Claude)) {
    usageData.push({
      provider: "Claude",
      details: _calculateClaudeUsage(rawUsages, useClaudePrivateKey),
    });
  }

  // Gemini
  const useGeminiPrivateKey = tenant.metadata?.geminiPrivateKeyEnabled ?? false;
  if (isProviderActive(ApiKeyProvider.Gemini)) {
    usageData.push({
      provider: "Gemini",
      details: _calculateGeminiUsage(rawUsages, useGeminiPrivateKey),
    });
  }

  // Audio
  const useSpeechPrivateKey = tenant.metadata?.speechPrivateKeyEnabled ?? false;
  const useElevenLabsPrivateKey =
    tenant.metadata?.elevenLabsPrivateKeyEnabled ?? false;
  if (isAudioActive(ApiKeyProvider.OpenAI) || isAudioActive(ApiKeyProvider.ElevenLabs)) {
    usageData.push({
      provider: "Audio",
      details: _calculateAudioUsage(
        rawUsages,
        useAzureOpenAIPrivateKey,
        useSpeechPrivateKey,
        useElevenLabsPrivateKey,
      ),
    });
  }

  // Flux
  const useFluxPrivateKey = tenant.metadata?.fluxPrivateKeyEnabled ?? false;
  if (isFeatureActive(ApiKeyProvider.Flux)) {
    usageData.push({
      provider: "Flux",
      details: _calculateFluxUsage(rawUsages, useFluxPrivateKey),
    });
  }

  // Embedding (Vector KB) - always show if there's embedding usage
  const embeddingUsageItems = _calculateEmbeddingUsage(rawUsages);
  if (embeddingUsageItems.length > 0) {
    usageData.push({
      provider: "Embedding (Vector KB)",
      details: embeddingUsageItems,
    });
  }

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