import { ChatOpenAI, AzureChatOpenAI } from "@langchain/openai";
import type { APIContext } from "astro";
import { decrypt } from "./secure";
import { TenantFeature, ApiKeyProvider } from "$types/TenantFeature";
import log from "./log";
import { UsageTrackerCallbackHandler } from "$callbackLLM/UsageTrackerCallbackHandler";
import { UsageType } from "$types/UsageTracking";

interface ChatConfigOverrides {
  customModel?: string;
}

// Initialize Perplexity AI's Chat API with OpenAI-like interface
export const initPerplexityOpenAI = (
  apiKey: string,
  model: string,
  tenantId: string,
) => {
  return new ChatOpenAI({
    openAIApiKey: apiKey, // Set API key for authentication
    configuration: { baseURL: "https://api.perplexity.ai" }, // Use Perplexity's API endpoint
    modelName: model, // Specify model (if provided)
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

// Initialize OpenAI's Chat API
const initChatOpenAI = (apiKey: string, model: string, tenantId: string) => {
  return new ChatOpenAI({
    apiKey,
    model,
    modelKwargs: {
      web_search_options: {
        search_context_size: "medium",
      },
    },
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

// Initialize Azure OpenAI Chat API
const initAzureChatOpenAI = (
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

export const initializeOpenAI = (
  ctx: APIContext,
  overrides?: ChatConfigOverrides,
) => {
  const { tenant } = ctx.locals;
  const { included_features: features } = ctx.locals.tenant;
  const { customModel } = overrides || {};

  // Find the text prompts feature in enabled features
  const textPromptsProvider = features?.find(
    (item) => item.name == TenantFeature.TextPrommpts,
  );

  // Determine API provider based on enabled features
  let provider = textPromptsProvider
    ? textPromptsProvider.provider
    : ApiKeyProvider.OpenAI;

  // If a custom model is provided, override the default API provider
  if (customModel) {
    provider = customModel as ApiKeyProvider;
  }
  log.i(provider, "API PROVIDER");

  // Perplexity AI
  if (provider == ApiKeyProvider.Perplexity) {
    const perplexityApiKey = decrypt(tenant?.perplexity_api_key || "");
    const perplexityModel: string = tenant?.perplexity_chat_model || "sonar";
    return initPerplexityOpenAI(
      perplexityApiKey,
      perplexityModel,
      tenant?._id?.toString(),
    );
  }

  // Azure OpenAI
  if (provider == ApiKeyProvider.AzureOpenAI) {
    const azureOpenAIApiKey = decrypt(tenant?.azure_openai_api_key || "");
    const azureOpenAIApiInstanceName = tenant?.azure_openai_instance_name || "";
    const azureOpenAIApiDeploymentName = tenant?.azure_openai_chat_model || "";
    const azureOpenAIApiVersion =
      import.meta.env.AZURE_OPENAI_API_VERSION || "2024-08-01-preview";

    return initAzureChatOpenAI(
      azureOpenAIApiKey,
      azureOpenAIApiInstanceName,
      azureOpenAIApiDeploymentName,
      azureOpenAIApiVersion,
      tenant?._id?.toString(),
    );
  }

  // OpenAI
  const apiKey = decrypt(tenant?.openai_api_key || "");
  return initChatOpenAI(
    apiKey,
    import.meta.env.OPENAI_MODEL,
    tenant?._id?.toString(),
  );
};

export default initializeOpenAI;
