import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
  AIMessage,
} from "@langchain/core/messages";
import { getInstructionMessage } from "$i18n/instructionMessages";
import PromptModel from "$data/models/prompt.model";
import KnowledgeBaseModel from "$data/models/knowledgeBase.model";
import { z } from "zod";
import { fileLoader } from "$utils/document-loader";
import type { APIRoute } from "astro";
import { AIMessageChunk } from "@langchain/core/messages";
import type { CreateKnowledgeBaseParams } from "../knowledge-base.json";
import initializeOpenAI from "$utils/chatModel";
import { MessageRole } from "$types/MessageHistory";
import { ApiKeyProvider, TenantFeature } from "$types/TenantFeature";

export type PromptDetails = {
  title: string;
  prompt: string;
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

// Helper function to check if provider is Perplexity
const isPerplexityProvider = (ctx: any, model?: string | null): boolean => {
  const { tenant } = ctx.locals;
  const { included_features: features } = ctx.locals.tenant;

  // Find the text prompts feature in enabled features
  const textPromptsProvider = features?.find(
    (item: any) => item.name == TenantFeature.TextPrompts,
  );

  // Determine API provider based on enabled features
  let provider = textPromptsProvider
    ? textPromptsProvider.provider
    : ApiKeyProvider.OpenAI;

  // If a custom model is provided, override the default API provider
  // Extract the provider name (the first segment).
  if (model) {
    provider = model.split(":")[0] as ApiKeyProvider;
  }

  return provider === ApiKeyProvider.Perplexity;
};

// Perplexity streaming function similar to callStreamingAPI in ToolEnhancedChatWidget
const callPerplexityStreamingAPI = async (
  ctx: any,
  prompt: any,
  messages: BaseMessage[],
  data: RunPromptParams,
  overrides: any
): Promise<Response> => {
  try {
    // Get headers from request object in Astro context
    const host = ctx.request.headers.get("host") || "localhost:4321";
    const protocol = ctx.request.headers.get("x-forwarded-proto") || "http";
    const previewUrl = `${protocol}://${host}`;

    // Get API configuration like in ToolEnhancedChatWidget
    const configResponse = await fetch(
      `${previewUrl}/.netlify/functions/getTranscriptionConfig`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
    );

    if (!configResponse.ok) {
      throw new Error("Failed to get transcription configuration");
    }

    const { apiKey, apiUrl: baseUrl } = await configResponse.json();
    const apiUrl = `${baseUrl}/api/prompt/execute`;

    const provider = "perplexity";
    const requestBody = {
      tenantId: ctx.locals.tenant?._id?.toString(),
      provider,
      prompt: data.article || "",
      promptId: data._id,
      stream: true,
      messageHistory: data.messageHistory || [],
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Check if response is event-stream
    if (response.headers.get("content-type")?.includes("text/event-stream")) {

      // Set up server-side streaming response for plain text
      const encoder = new TextEncoder();
      const headers = new Headers();
      headers.set("Content-Type", "text/plain; charset=UTF-8");
      headers.set("Transfer-Encoding", "chunked");

      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();

      // Process the streaming response
      (async () => {
        try {
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) {
            throw new Error("No reader available");
          }

          let buffer = "";
          let messageContent = "";
          let citations: any[] = [];
          let isSentCitations = false;

          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // Process complete lines from buffer
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith("data: ")) {
                try {
                  const jsonStr = trimmedLine.substring(6).trim();

                  if (!jsonStr || jsonStr === "[DONE]" || jsonStr === "") {
                    continue;
                  }

                  if (!jsonStr.startsWith("{") && !jsonStr.startsWith("[")) {
                    continue;
                  }

                  const eventData = JSON.parse(jsonStr);

                  switch (eventData.type) {
                    case "start":
                      break;

                    case "chunk":
                      if (eventData.content && typeof eventData.content === "string") {
                        messageContent += eventData.content;
                        // Send content chunk as plain text
                        await writer.write(encoder.encode(eventData.content));
                      }
                      break;

                    case "citations":
                      // Store citations but don't send them yet to avoid interrupting content flow
                      if (eventData.citations && eventData.citations.length > 0) {
                        citations = eventData.citations;
                        // Don't send citations here - wait for completion or end of content
                      }
                      break;

                    case "complete":
                      console.log(`✅ Complete! Processing time: ${eventData.processingTimeMs}ms`);
                      // Now send citations at the end after all content is streamed
                      if (citations.length > 0 && !isSentCitations) {
                        isSentCitations = true;
                        const citationsJson = JSON.stringify({ citations });
                        await writer.write(encoder.encode(citationsJson));
                      }

                      // Complete the stream
                      return;

                    case "error":
                      console.error(`❌ Perplexity stream error: ${eventData.error}`);
                      const errorMessage = eventData.error || "Perplexity streaming failed.";
                      await writer.write(encoder.encode("Error: " + errorMessage + "\n"));
                      throw new Error(eventData.error);
                  }
                } catch (parseError) {
                  console.warn("Failed to parse Perplexity event data:", parseError);
                }
              }
            }
          }
        } catch (error) {
          console.error("Perplexity streaming error:", error);
          await writer.write(
            encoder.encode("Error processing Perplexity stream: " + error + "\n"),
          );
        } finally {
          writer.close();
        }
      })();

      return new Response(readable, { headers });
    }

    // If not event-stream, throw error since we expect streaming
    throw new Error("Expected event-stream response from Perplexity API");

  } catch (error) {
    console.error("Perplexity streaming API error:", error);

    // Fallback to regular LangChain streaming for Perplexity
    const encoder = new TextEncoder();
    const headers = new Headers();
    headers.set("Content-Type", "text/plain; charset=UTF-8");
    headers.set("Transfer-Encoding", "chunked");

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    const model = initializeOpenAI(ctx, overrides);

    (async () => {
      try {
        let isSentCitations = false;
        let partialChunk = "";

        const stream: AsyncIterable<AIMessageChunk> = await model.stream(messages);
        for await (const chunk of stream) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rawResponse = chunk?.additional_kwargs?.__raw_response as any;
          const citations = rawResponse?.citations ?? [];
          if (citations.length > 0 && !isSentCitations) {
            isSentCitations = true;
            console.log("Citations found but not sending to avoid corruption:", citations);
            // Don't write citations to text stream to avoid corruption
          }

          partialChunk += chunk.content;
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
        console.error("Perplexity fallback streaming error:", error);
        await writer.write(
          encoder.encode("Error processing chunks:" + error + "\n"),
        );
      } finally {
        writer.close();
      }
    })();

    return new Response(readable, { headers });
  }
};

export const POST: APIRoute = async (ctx) => {
  const { params, request } = ctx;
  const { default_language } = ctx.locals.tenant;
  const defaultLanguage = default_language || "en";
  const id = params.id;

  try {
    const requestParams = await request.json();

    const data = RunPromptParamsSchema.parse({
      ...requestParams,
      _id: id,
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
    messages.push(new SystemMessage(getInstructionMessage(defaultLanguage)));

    messages.push(new SystemMessage(prompt.prompt));

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

    const overrides = prompt.model ? { customModel: prompt.model } : {};
    // Check if provider is Perplexity and use streaming API
    if (isPerplexityProvider(ctx, prompt.model)) {
      return await callPerplexityStreamingAPI(ctx, prompt, messages, data, overrides);
    }

    // Original streaming flow for other providers
    const encoder = new TextEncoder();
    const headers = new Headers();
    headers.set("Content-Type", "text/plain; charset=UTF-8");
    headers.set("Transfer-Encoding", "chunked");

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    const model = initializeOpenAI(ctx, overrides);

    (async () => {
      try {
        let isSentCitations = false;
        let partialChunk = "";

        const stream: AsyncIterable<AIMessageChunk> =
          await model.stream(messages);
        for await (const chunk of stream) {
          //console.log("stream chunk ==> ", chunk);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rawResponse = chunk?.additional_kwargs?.__raw_response as any;
          const citations = rawResponse?.citations ?? [];
          if (citations.length > 0 && !isSentCitations) {
            isSentCitations = true;
            await writer.write(encoder.encode(JSON.stringify({ citations })));
          }

          partialChunk += chunk.content;
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
