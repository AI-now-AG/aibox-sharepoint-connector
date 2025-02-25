import { ChatOpenAI, AzureChatOpenAI } from "@langchain/openai";
import type { APIContext } from "astro";
import { decrypt } from "./secure";
import { TenantFeature, ApiKeyProvider } from "$types/TenantFeature";
import ChatPerplexity, { PerplexityModel } from "$llm/Perplexity";
import log from "./log";

export const initPerplexityOpenAI = (
  apiKey: string,
  model?: PerplexityModel,
  maxToken?: number,
) => {
  return new ChatPerplexity({
    api_key: apiKey,
    model: model ?? PerplexityModel.SONAR,
    max_tokens: maxToken || 400,
  });
};

const initChatOpenAI = (apiKey: string, model: string) => {
  return new ChatOpenAI({
    apiKey,
    model,
  });
};

const initAzureChatOpenAI = (
  azureOpenAIApiKey: string,
  azureOpenAIApiInstanceName: string,
  azureOpenAIApiDeploymentName: string,
  azureOpenAIApiVersion: string,
) => {
  return new AzureChatOpenAI({
    azureOpenAIApiKey,
    azureOpenAIApiInstanceName,
    azureOpenAIApiDeploymentName,
    azureOpenAIApiVersion,
  });
};

export const initializeOpenAI = (ctx: APIContext) => {
  const { included_features: features } = ctx.locals.tenant;

  const textPromptsProvider = features?.find(
    (item) => item.name == TenantFeature.TextPrommpts,
  );
  const provider = textPromptsProvider
    ? textPromptsProvider.provider
    : ApiKeyProvider.OpenAI;

  log.i(provider, "API PROVIDER");
  // Perplexity
  if (provider == ApiKeyProvider.Perplexity) {
    const perplexityApiKey = decrypt(
      ctx.locals.tenant?.perplexity_api_key || "",
    );
    const perplexityModel: any =
      ctx.locals.tenant?.perplexity_chat_model || PerplexityModel.SONAR;
    const maxToken = import.meta.env.CHAT_PERPLEXITY_MAX_TOKEN || 400;

    return initPerplexityOpenAI(perplexityApiKey, perplexityModel, maxToken);
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
