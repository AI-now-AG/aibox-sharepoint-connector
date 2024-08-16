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
  model: import.meta.env.OPENAI_MODEL,
});

export const POST: APIRoute = async (ctx) => {
  try {
    const params = await ctx.request.json();
    if (!params.promptId) {
      return new Response(
        JSON.stringify({
          message: "Require 'PromptId' field",
        }),
        { status: 400 }
      );
    }
    if (!params.article) {
      return new Response(
        JSON.stringify({
          message: "Require 'article' field",
        }),
        { status: 400 }
      );
    }

    const prompt = await PromptModel.get(params.promptId);
    if (!prompt?.prompt) {
      return new Response(
        JSON.stringify({
          message: "Prompt field not defined",
        }),
        { status: 400 }
      );
    }

    const messages: BaseMessage[] = [];

    if (prompt?.instructions) {
      const calls = prompt.instructions.map(async (inst) => {
        const instruction = await InstructionModel.get(inst.toString());
        return instruction;
      });
      const instructions = await Promise.all(calls);
      instructions.forEach((instruction) => {
        if (instruction?.instruction) {
          messages.push(new SystemMessage(instruction.instruction));
        }
      });
    }

    if (prompt?.knowledgebase) {
      const calls = prompt.knowledgebase.map(async (kb) => {
        const instruction = await KnowledgeBaseModel.get(kb.toString());
        return instruction;
      });
      const knowledgebases = await Promise.all(calls);
      knowledgebases.forEach((knowledgebase) => {
        if (knowledgebase?.knowledge_base) {
          messages.push(new SystemMessage(knowledgebase.knowledge_base));
        }
      });
    }


    messages.push(new HumanMessage(params.article));

    // Handle image uploads
    if (params.images) {
      params.images.forEach((object: any) => {
        if (object.content) {
          messages.push(
            new HumanMessage({
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: object.content,
                  }
                }],
            })
          );
        }
      });
    }

    // Handle file uploads
    if (params.files) {
      params.files.forEach((object: any) => {
        if (object.content) {
          const messageContent = object.type.startsWith('text/')
            ? object.content
            : `data:${object.type};base64,${object.content}`;

          messages.push(
            new HumanMessage({
              content: [{
                type: "text", // TODO: make this dynamically change as needed
                text: object.content,
              }],
            })
          );
        }
      });
    }

    const parser = new StringOutputParser();
    const result = await model.invoke(messages);
    const headlines = await parser.invoke(result);

    return new Response(
      JSON.stringify({
        headlines,
      }),
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({
        message: "Internal Server Error: " + error,
      }),
      { status: 500 }
    );
  }
};
