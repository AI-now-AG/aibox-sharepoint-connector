import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI, AzureChatOpenAI } from "@langchain/openai";
import type { APIContext } from "astro";
import type { ActionAPIContext } from "astro:actions";
import { TenantFeature, ApiKeyProvider } from "$types/TenantFeature";
import log from "./log";
import { getGlobalApiKeys, resolveApiKey } from "./resolveApiKey";
import { UsageTrackerCallbackHandler } from "$callbackLLM/UsageTrackerCallbackHandler";
import { UsageType } from "$types/UsageTracking";

interface ChatConfigOverrides {
  customProvider?: string;
  customModel?: string;
}

// Perplexity AI
export const createPerplexityModel = (
  apiKey: string,
  model: string,
  tenantId: string,
) => {
  return new ChatOpenAI({
    openAIApiKey: apiKey, // Set API key for authentication
    configuration: { baseURL: "https://api.perplexity.ai" }, // Use Perplexity's API endpoint
    modelName: model, // Specify model (if provided)
    modelKwargs: {
      web_search_options: {
        search_context_size: "medium",
      },
    },
    callbacks: [
      new UsageTrackerCallbackHandler(
        tenantId,
        ApiKeyProvider.Perplexity,
        model,
        UsageType.Text,
      ),
    ],
    __includeRawResponse: true,
  });
};

// OpenAI's Chat API
const createOpenAIModel = (apiKey: string, model: string, tenantId: string) => {
  return new ChatOpenAI({
    apiKey,
    model,
    callbacks: [
      new UsageTrackerCallbackHandler(
        tenantId,
        ApiKeyProvider.OpenAI,
        model,
        UsageType.Text,
      ),
    ],
  });
};

// Azure OpenAI Chat API
const createAzureOpenAIModel = (
  azureOpenAIApiKey: string,
  azureOpenAIApiInstanceName: string,
  azureOpenAIApiDeploymentName: string,
  azureOpenAIApiVersion: string,
  tenantId: string,
) => {
  return new AzureChatOpenAI({
    azureOpenAIApiKey,
    azureOpenAIApiInstanceName,
    azureOpenAIApiDeploymentName,
    azureOpenAIApiVersion,
    callbacks: [
      new UsageTrackerCallbackHandler(
        tenantId,
        ApiKeyProvider.AzureOpenAI,
        azureOpenAIApiDeploymentName,
        UsageType.Text,
      ),
    ],
  });
};

// Claude (Anthropic)
const createClaudeModel = (apiKey: string, model: string, tenantId: string) => {
  return new ChatAnthropic({
    apiKey,
    model,
    callbacks: [
      new UsageTrackerCallbackHandler(
        tenantId,
        ApiKeyProvider.Claude,
        model,
        UsageType.Text,
      ),
    ],
  });
};

// Gemini (Google GenAI)
const createGeminiModel = (apiKey: string, model: string, tenantId: string) => {
  return new ChatGoogleGenerativeAI({
    apiKey,
    model,
    callbacks: [
      new UsageTrackerCallbackHandler(
        tenantId,
        ApiKeyProvider.Gemini,
        model,
        UsageType.Text,
      ),
    ],
  });
};

export const createChatModel = async (
  ctx: APIContext | ActionAPIContext,
  overrides?: ChatConfigOverrides,
) => {
  const { tenant } = ctx.locals;
  const { included_features: features } = ctx.locals.tenant;
  const { customModel, customProvider } = overrides || {};
  const globalKeys = await getGlobalApiKeys();

  // Find the text prompts feature in enabled features
  const textPromptsProvider = features?.find(
    (item) => item.name == TenantFeature.TextPrompts,
  );

  // Determine API provider based on enabled features
  let provider = customProvider
    ? customProvider
    : textPromptsProvider
      ? textPromptsProvider.provider
      : ApiKeyProvider.OpenAI;

  // If a custom model is provided, override the default API provider
  // Extract the provider name (the first segment).
  if (customModel) {
    provider = customModel.split(":")[0] as ApiKeyProvider;
  }
  log.i(provider, "API PROVIDER");

  // Perplexity AI
  if (provider == ApiKeyProvider.Perplexity) {
    const perplexityApiKey = resolveApiKey("perplexity_api_key", tenant, globalKeys);
    const perplexityModel: string = tenant?.perplexity_chat_model || "sonar";
    return createPerplexityModel(
      perplexityApiKey,
      perplexityModel,
      tenant?._id?.toString(),
    );
  }

  // Azure OpenAI
  if (provider == ApiKeyProvider.AzureOpenAI) {
    const azureOpenAIApiKey = resolveApiKey("azure_openai_api_key", tenant, globalKeys);
    const azureOpenAIApiInstanceName = tenant?.azure_openai_instance_name || "";
    const azureOpenAIApiDeploymentName = tenant?.azure_openai_chat_model || "";
    const azureOpenAIApiVersion =
      import.meta.env.AZURE_OPENAI_API_VERSION || "2024-08-01-preview";

    return createAzureOpenAIModel(
      azureOpenAIApiKey,
      azureOpenAIApiInstanceName,
      azureOpenAIApiDeploymentName,
      azureOpenAIApiVersion,
      tenant?._id?.toString(),
    );
  }

  // Claude (Anthropic)
  if (provider == ApiKeyProvider.Claude) {
    const anthropicApiKey = resolveApiKey("anthropic_api_key", tenant, globalKeys);
    const anthropicModel: string =
      tenant?.anthropic_chat_model || "claude-sonnet-4-20250514";
    return createClaudeModel(
      anthropicApiKey,
      anthropicModel,
      tenant?._id?.toString(),
    );
  }

  // Gemini (Google GenAI)
  if (provider == ApiKeyProvider.Gemini) {
    const geminiApiKey = resolveApiKey("gemini_api_key", tenant, globalKeys);
    const geminiModel: string = tenant?.gemini_chat_model || "gemini-2.5-flash";
    return createGeminiModel(
      geminiApiKey,
      geminiModel,
      tenant?._id?.toString(),
    );
  }

  // OpenAI
  const apiKey = resolveApiKey("openai_api_key", tenant, globalKeys);
  return createOpenAIModel(
    apiKey,
    import.meta.env.OPENAI_MODEL || "gpt-4o",
    tenant?._id?.toString(),
  );
};

export default createChatModel;
