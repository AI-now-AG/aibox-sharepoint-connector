import type { APIRoute } from "astro";
import { z } from "zod";
import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
  AIMessage,
} from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { fileLoader } from "$utils/document-loader";
import initializeOpenAI from "$utils/chatModel";
import { MessageRole } from "$types/MessageHistory";
import ChatPerplexity from "$llm/Perplexity";

const AttachmentSchema = z.object({
  name: z.string(),
  type: z.string(),
  content: z.string(),
});

const MessageSchema = z.object({
  role: z.nativeEnum(MessageRole),
  content: z.string(),
});

const RequestParamsSchema = z.object({
  article: z.string().optional(),
  images: z.array(AttachmentSchema).optional(),
  files: z.array(AttachmentSchema).optional(),
  messageHistory: z.array(MessageSchema).optional(),
});

export const POST: APIRoute = async (ctx) => {
  const { request } = ctx;

  try {
    const encoder = new TextEncoder();

    const requestParams = await request.json();

    const data = RequestParamsSchema.parse({
      ...requestParams,
    });

    const messages: BaseMessage[] = [];
    messages.push(new SystemMessage("You are a helpful assistant."));

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

    // Handle image uploads
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

    // Handle file uploads
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

    // Set headers to enable chunked transfer
    const headers = new Headers();
    headers.set("Content-Type", "text/plain; charset=UTF-8");
    headers.set("Transfer-Encoding", "chunked");

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    const model = initializeOpenAI(ctx);

    (async () => {
      try {
        const stream = await model.pipe(parser).stream(messages);

        let partialChunk = "";
        for await (const chunk of stream) {
          if (model instanceof ChatPerplexity) {
            partialChunk = chunk.choices[0]?.delta?.content;
          } else {
            partialChunk += chunk;
          }

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
