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
import { z } from "zod";

const RunPromptParamsSchema = z.object({
  _id: z.string(),
  article: z.string().min(1),
});

export type RunPromptParams = z.infer<typeof RunPromptParamsSchema>;

export const model = new ChatOpenAI({
  apiKey: import.meta.env.OPENAI_API_KEY,
  model: import.meta.env.OPENAI_MODEL,
});

export const POST: APIRoute = async ({ params, request }) => {
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

    messages.push(new HumanMessage(data.article));

    // Handle image uploads
    if (data.images) {
      data.images.forEach((object: any) => {
        if (object.content) {
          messages.push(
            new HumanMessage(object.content),
            // new HumanMessage({
            //   content: [
            //     {
            //       type: "image_url",
            //       image_url: {
            //         url: object.content,
            //       },
            //     },
            //   ],
            // }),
          );
        }
      });
    }

    // Handle file uploads
    if (data.files) {
      data.files.forEach((object: any) => {
        if (object.content) {
          // const messageContent = object.type.startsWith("text/")
          //   ? object.content
          //   : `data:${object.type};base64,${object.content}`;
          messages.push(
            new HumanMessage({
              content: [
                {
                  type: "text", // TODO: make this dynamically change as needed
                  text: object.content,
                },
              ],
            }),
          );
        }
      });
    }

    const parser = new StringOutputParser();

    // Set headers to enable chunked transfer
    const headers = new Headers();
    headers.set("Content-Type", "text/plain; charset=UTF-8");
    headers.set("Transfer-Encoding", "chunked");

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    (async () => {
      try {
        const stream = await model.pipe(parser).stream(messages);

        let partialChunk = "";
        for await (const chunk of stream) {
          partialChunk += chunk;

          // Try to process and send the complete part of the chunk
          let lastCompleteCharIndex = partialChunk.length;
          try {
            encoder.encode(partialChunk); // Attempt to encode the whole string
          } catch {
            // If encoding fails, determine the last valid character
            lastCompleteCharIndex = Buffer.byteLength(partialChunk) - 1;
          }

          const validChunk = partialChunk.slice(0, lastCompleteCharIndex);
          partialChunk = partialChunk.slice(lastCompleteCharIndex); // Save the incomplete part for the next iteration

          // Send the valid part of the chunk
          if (validChunk) {
            await writer.write(encoder.encode(validChunk));
          }
        }
        // for await (const chunk of stream) {
        //   const formattedChunk = chunk.trim() + "\n";
        //   console.log(formattedChunk)
        //   await writer.write(encoder.encode(formattedChunk));
        // }
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

    // const stream = await model.pipe(parser).stream(messages);
    // //const result = await model.invoke(messages);
    // //const headlines = await parser.stream(result);
    // let data = "";
    // for await (const chunk of stream) {
    //   console.log("-----"+chunk);
    //   data += chunk;
    // }
    // console.log("Response", result);
    // return new Response(
    //   JSON.stringify({
    //     data,
    //   }),
    // );
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
