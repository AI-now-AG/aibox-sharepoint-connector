//import { ChatOpenAI } from "@langchain/openai";
import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
  AIMessage,
} from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import PromptModel from "$data/models/prompt.model";
import InstructionModel from "$data/models/instruction.model";
import KnowledgeBaseModel from "$data/models/knowledgeBase.model";
import { z } from "zod";
import { fileLoader } from "$utils/document-loader";
import type { APIRoute } from "astro";
import type { CreateInstructionParams } from "../instructions.json";
import type { CreateKnowledgeBaseParams } from "../knowledge-base.json";
import initializeOpenAI from "$utils/chatModel";
import { MessageRole } from "$types/MessageHistory";
import ChatPerplexity from "$llm/Perplexity";

export type PromptDetails = {
  title: string;
  prompt: string;
  instructions: CreateInstructionParams[];
  knowledgebase: CreateKnowledgeBaseParams[];
};

const AttachmentSchema = z.object({
  name: z.string(),
  type: z.string(),
  content: z.string(),
});

const MessageSchema = z.object({
  role: z.nativeEnum(MessageRole),
  content: z.string(),
});

const RunPromptParamsSchema = z.object({
  _id: z.string(),
  article: z.string().optional(),
  images: z.array(AttachmentSchema).optional(),
  files: z.array(AttachmentSchema).optional(),
  messageHistory: z.array(MessageSchema).optional(),
});

export type RunPromptParams = z.infer<typeof RunPromptParamsSchema>;
export type Attachment = z.infer<typeof AttachmentSchema>;

export const POST: APIRoute = async (ctx) => {
  const { params, request } = ctx;
  const id = params.id;

  try {
    const encoder = new TextEncoder();

    const requestParams = await request.json();

    const data = RunPromptParamsSchema.parse({
      ...requestParams,
      ...{ _id: id },
    });

    const prompt = await PromptModel.get(data._id);
    if (!prompt?.prompt) {
      return new Response(
        JSON.stringify({
          message: "Prompt field not defined",
        }),
        { status: 400 },
      );
    }

    const messages: BaseMessage[] = [];
    messages.push(new SystemMessage(prompt.prompt));

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

    let hasMessageHistory = false;
    if (data.messageHistory && data.messageHistory.length > 0) {
      hasMessageHistory = true;
      data.messageHistory?.forEach((message) => {
        messages.push(
          message.role === MessageRole.User
            ? new HumanMessage(message.content)
            : new AIMessage(message.content),
        );
      });
    }
    if (data.article) {
      messages.push(new HumanMessage(data.article));
    }

    if (data.images && !hasMessageHistory) {
      data.images.forEach((object) => {
        if (object.content) {
          messages.push(
            new HumanMessage({
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: object.content,
                  },
                },
              ],
            }),
          );
        }
      });
    }

    if (data.files && !hasMessageHistory) {
      for (const file of data.files) {
        if (file.content) {
          const docs = await fileLoader(file);

          if (docs) {
            const content = docs.map((doc) => doc.pageContent).join("\n");

            messages.push(
              new HumanMessage({
                content: [
                  {
                    type: "text",
                    text: "File content:\n------\n" + content + "------",
                  },
                ],
              }),
            );
          }
        }
      }
    }

    const parser = new StringOutputParser();

    const headers = new Headers();
    headers.set("Content-Type", "text/plain; charset=UTF-8");
    headers.set("Transfer-Encoding", "chunked");

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    const overrides = prompt.model ? { customModel: prompt.model } : {};
    const model = initializeOpenAI(ctx, overrides);

    (async () => {
      try {
        let isSentCitations = false;
        let citations = [];
        let partialChunk = "";

        const stream = await model.pipe(parser).stream(messages);
        for await (const chunk of stream) {
          if (model instanceof ChatPerplexity) {
            citations = chunk.citations ?? [];
            if (!isSentCitations) {
              isSentCitations = true;
              await writer.write(encoder.encode(JSON.stringify({ citations })));
            }
            partialChunk = chunk.choices[0]?.delta?.content;
          } else {
            partialChunk += chunk;
          }
          
          let lastCompleteCharIndex = partialChunk.length;
          try {
            encoder.encode(partialChunk);
          } catch {
            lastCompleteCharIndex = Buffer.byteLength(partialChunk) - 1;
          }

          const validChunk = partialChunk.slice(0, lastCompleteCharIndex);
          partialChunk = partialChunk.slice(lastCompleteCharIndex); 

          if (validChunk) {
            await writer.write(encoder.encode(validChunk));
          }
        }
      } catch (error) {
        console.error();
        await writer.write(
          encoder.encode("Error processing chunks:" + error + "\n"),
        );
      } finally {
        writer.close();
      }
    })();

    return new Response(readable, {
      headers,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({
        message: "Internal Server Error: " + error,
      }),
      { status: 500 },
    );
  }
};

export const PUT: APIRoute<PromptDetails> = async (ctx) => {
  try {
    const promptId = ctx.url.searchParams.get("_id") as string;
    const params = (await ctx.request.json()) as PromptDetails;

    if (params) {
      await PromptModel.updatePromptField(promptId, params.prompt);

      const instructionCalls = params.instructions.map(async (inst) => {
        const instruction = await InstructionModel.updateInstruction(
          inst._id!,
          inst.instruction,
        );
        return instruction;
      });
      await Promise.all(instructionCalls);

      const kbCalls = params.knowledgebase.map(async (kb) => {
        const instruction = await KnowledgeBaseModel.updateKnowledgeBase(
          kb._id!,
          kb.knowledge_base,
        );
        return instruction;
      });
      await Promise.all(kbCalls);

      return new Response(
        JSON.stringify({
          message: "Prompt updated",
        }),
        {
          status: 200,
        },
      );
    } else {
      return new Response(
        JSON.stringify({
          message: "Error while parsing the prompt",
        }),
        {
          status: 500,
        },
      );
    }
  } catch (error) {
    console.debug(error);

    return new Response(
      JSON.stringify({
        message: "Error while updating the prompt",
        error: error,
      }),
      {
        status: 500,
      },
    );
  }
};
