import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import type { APIRoute } from "astro";
import PromptModel from "$data/models/prompt.model";

export const model = new ChatOpenAI({
  apiKey: import.meta.env.OPENAI_API_KEY,
  model: "gpt-4o",
});

export const POST: APIRoute = async (ctx) => {
  const params = await ctx.request.json();
  if (!params.promptId) {
    return new Response(
      JSON.stringify({
        messages: "Require 'PromptId' field",
      }),
    );
  }
  if (!params.article) {
    return new Response(
      JSON.stringify({
        message: "Require 'article' field",
      }),
    );
  }

  const prompt = await PromptModel.get(params.promptId);
  if (!prompt?.prompt) {
    return new Response(
      JSON.stringify({
        message: "Prompt field not defined",
      }),
    );
  }

  const messages = [
    new SystemMessage(prompt!.prompt),
    // new SystemMessage(somediaInstructions),
    new HumanMessage(params.article),
  ];
  const parser = new StringOutputParser();
  const result = await model.invoke(messages);
  const headlines = await parser.invoke(result);

  return new Response(
    JSON.stringify({
      headlines,
    }),
  );
};
