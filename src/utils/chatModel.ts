import { ChatOpenAI } from "@langchain/openai";
import type { APIContext } from "astro";
import { ApiKeyProvider } from "$data/models/tenant.model";

export const initializeOpenAI = (ctx: APIContext) => {
  const apiKeyProvider = ctx.locals.tenant?.api_key_provider;

  let apiKey;
  if (apiKeyProvider == ApiKeyProvider.OpenAI) {
    apiKey = ctx.locals.tenant?.openai_api_key;
  }
  if (apiKeyProvider == ApiKeyProvider.AzureOpenAI) {
    apiKey = ctx.locals.tenant?.azure_openai_api_key;
  }

  // fallback
  if (!apiKey) {
    apiKey = import.meta.env.OPENAI_API_KEY;
  }

  console.log("initializeOpenAI config", {
    tenant: ctx.locals.tenant,
    apiKey,
  });

  return new ChatOpenAI({
    apiKey: apiKey as string,
    model: import.meta.env.OPENAI_MODEL,
  });
};

export default initializeOpenAI;
