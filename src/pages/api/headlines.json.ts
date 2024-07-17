import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";

export const model = new ChatOpenAI({
  apiKey: import.meta.env.OPENAI_API_KEY,
  model: "gpt-4o",
});

import type { APIRoute } from "astro";

export const POST: APIRoute = async (ctx) => {
  const formData = await ctx.request.formData();

  const prompt = formData.get("prompt") as string;
  if (!prompt) {
    return new Response(
      JSON.stringify({
        message: "Require 'prompt' field",
      }),
    );
  }

  const instruction = formData.get("instruction") as string;
  if (!instruction) {
    return new Response(
      JSON.stringify({
        message: "Require 'instruction' field",
      }),
    );
  }
  
  const article = formData.get("article") as string;
  if (!article) {
    return new Response(
      JSON.stringify({
        message: "Require 'article' field",
      }),
    );
  }

  const messages = [
    new SystemMessage(prompt),
    new SystemMessage(instruction),
    new HumanMessage(article),
  ];
  await model.invoke(messages);
  const parser = new StringOutputParser();
  const result = await model.invoke(messages);

  const headlines = await parser.invoke(result);
  
  return new Response(
    JSON.stringify({
      headlines,
    }),
  );

}