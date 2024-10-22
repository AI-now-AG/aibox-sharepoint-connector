import { ChatOpenAI } from "@langchain/openai";
import type { APIContext } from "astro";
import { ApiKeyProvider } from "$data/models/tenant.model";
import { decrypt } from "./secure";
import log from "./log";

export const initializeOpenAI = (ctx: APIContext) => {
  const apiKeyProvider = ctx.locals.tenant?.api_key_provider;

  let apiKey;
  if (apiKeyProvider == ApiKeyProvider.OpenAI) {
    try {
      apiKey = decrypt(ctx.locals.tenant?.openai_api_key || "");
    } catch (error) {
      log.e(error, "ERROR OPEN AI KEY");
    }
  }
  if (apiKeyProvider == ApiKeyProvider.AzureOpenAI) {
    try {
      apiKey = decrypt(ctx.locals.tenant?.azure_openai_api_key || "");
    } catch (error) {
      log.e(error, "ERROR AZURE OPEN AI KEY");
    }
  }
  // fallback
  if (!apiKey) {
    try {
      apiKey = decrypt(import.meta.env.OPENAI_API_KEY);
    } catch (error) {
      log.e(error, "ERROR OPEN AI KEY");
    }
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
