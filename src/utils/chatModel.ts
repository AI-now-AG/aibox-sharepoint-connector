import { ChatOpenAI } from "@langchain/openai";
import type { APIContext } from "astro";
import { decrypt } from "./secure";
import log from "./log";

export const initializeOpenAI = (ctx: APIContext) => {
  let apiKey;
  try {
    apiKey = decrypt(ctx.locals.tenant?.openai_api_key || "");
  } catch (error) {
    log.e(error, "ERROR OPEN AI KEY");
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
