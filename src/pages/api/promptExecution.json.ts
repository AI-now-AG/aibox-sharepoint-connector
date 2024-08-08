import { ChatOpenAI } from "@langchain/openai";
import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import type { APIRoute } from "astro";
import PromptModel from "$data/models/prompt.model";
import InstructionModel from "$data/models/instruction.model";
import KnowledgeBaseModel from "$data/models/knowledgeBase.model";

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

  const messages: BaseMessage[] = [];

  if (prompt?.instructions) {
    const calls = prompt?.instructions.map(async (inst) => {
      const instruction = await InstructionModel.get(inst.toString());
      return instruction;
    });
    const instructions = await Promise.all(calls);
    const instructionsData = instructions.map(
      (instruction) => instruction?.instruction,
    );
    instructionsData.forEach((instruction) => {
      if (instruction) {
        messages.push(new SystemMessage(instruction));
      }
    });
  }

  if (prompt?.knowledgebase) {
    const calls = prompt?.knowledgebase.map(async (kb) => {
      const instruction = await KnowledgeBaseModel.get(kb.toString());
      return instruction;
    });
    const knowledgebases = await Promise.all(calls);
    const knowledgeBaseData = knowledgebases.map(
      (knowledgebase) => knowledgebase?.knowledge_base,
    );
    knowledgeBaseData.forEach((knowledgebase) => {
      if (knowledgebase) {
        messages.push(new SystemMessage(knowledgebase));
      }
    });
  }

  messages.push(new SystemMessage(prompt!.prompt));
  messages.push(new HumanMessage(params.article));
  messages.push(new HumanMessage(params.article));
  // const messages = [
  //   new SystemMessage(prompt!.prompt),
  //   new SystemMessage(somediaInstructions),
  //   new HumanMessage(params.article),
  // ];
  const parser = new StringOutputParser();
  const result = await model.invoke(messages);
  const headlines = await parser.invoke(result);

  return new Response(
    JSON.stringify({
      headlines,
    }),
  );
};
