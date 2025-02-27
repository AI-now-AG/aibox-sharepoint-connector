import { ChatOpenAI, AzureChatOpenAI } from "@langchain/openai";
import type { APIContext } from "astro";
import { decrypt } from "./secure";
import { TenantFeature, ApiKeyProvider } from "$types/TenantFeature";
//import ChatPerplexity, { PerplexityModel } from "$llm/Perplexity";
import log from "./log";

interface ChatConfigOverrides {
  customModel?: string;
}

// Initialize Perplexity AI's Chat API with OpenAI-like interface
export const initPerplexityOpenAI = (apiKey: string, model: string) => {
  return new ChatOpenAI({
    openAIApiKey: apiKey, // Set API key for authentication
    configuration: { baseURL: "https://api.perplexity.ai" }, // Use Perplexity's API endpoint
    modelName: model, // Specify model (if provided)
    //maxTokens: 400, // Define max token limit (if provided)
  });
};

// Initialize OpenAI's Chat API
const initChatOpenAI = (apiKey: string, model: string) => {
  return new ChatOpenAI({
    apiKey, // OpenAI API key
    model, // Model name
  });
};

// Initialize Azure OpenAI Chat API
const initAzureChatOpenAI = (
  azureOpenAIApiKey: string,
  azureOpenAIApiInstanceName: string,
  azureOpenAIApiDeploymentName: string,
  azureOpenAIApiVersion: string,
) => {
  return new AzureChatOpenAI({
    azureOpenAIApiKey, // Set API key for Azure authentication
    azureOpenAIApiInstanceName, // Set Azure instance name
    azureOpenAIApiDeploymentName, // Specify deployment name
    azureOpenAIApiVersion, // Define API version
  });
};

export const initializeOpenAI = (
  ctx: APIContext,
  overrides?: ChatConfigOverrides,
) => {
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
    const perplexityApiKey = decrypt(
      ctx.locals.tenant?.perplexity_api_key || "",
    );
    const perplexityModel: string =
      ctx.locals.tenant?.perplexity_chat_model || "sonar";
    return initPerplexityOpenAI(perplexityApiKey, perplexityModel);
  }

  // Azure OpenAI
  if (provider == ApiKeyProvider.AzureOpenAI) {
    const azureOpenAIApiKey = decrypt(
      ctx.locals.tenant?.azure_openai_api_key || "",
    );
    const azureOpenAIApiInstanceName =
      ctx.locals.tenant?.azure_openai_instance_name || "";
    const azureOpenAIApiDeploymentName =
      ctx.locals.tenant?.azure_openai_chat_model || "";
    const azureOpenAIApiVersion =
      import.meta.env.AZURE_OPENAI_API_VERSION || "2024-08-01-preview";

    return initAzureChatOpenAI(
      azureOpenAIApiKey,
      azureOpenAIApiInstanceName,
      azureOpenAIApiDeploymentName,
      azureOpenAIApiVersion,
    );
  }

  // OpenAI
  const apiKey = decrypt(ctx.locals.tenant?.openai_api_key || "");
  return initChatOpenAI(apiKey, import.meta.env.OPENAI_MODEL);
};

export default initializeOpenAI;
