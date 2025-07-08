import {
  type Handler,
  type HandlerEvent,
  type HandlerResponse,
} from "@netlify/functions";
import PromptModel from "$data/models/prompt.model";
import KnowledgeBaseModel from "$data/models/knowledgeBase.model";
import { getInstructionMessage } from "$i18n/instructionMessages";
import { getStore } from "@netlify/blobs";
import { OpenAI } from "openai";
import { ObjectId } from "mongodb";
import { decrypt } from "$utils/secure";
import { ResponseStatus, ToolName } from "$types/AIResponse";
import { type FileInput } from "$types/FileInput";
import { ApiKeyProvider } from "$types/TenantFeature";
import ResponseModel, { type Response } from "$data/models/response.model";
import TenantModel from "$data/models/tenant.model";
import { UsageType, TextModel } from "$types/UsageTracking";
import UsageLogModel, { type UsageLog } from "$data/models/usageLog.model";
import type {
  ResponseInputFile,
  ResponseInputImage,
  ResponseInputText,
  ResponseUsage,
} from "openai/resources/responses/responses";
import { NETLIFY_BLOBS_STORE } from "$constants";

type RequestTool = "image" | "websearch";

interface CreateResponseParams {
  tenantId: string;
  uniqueId: string;
  prompt: string;
  instructions?: string;
  files?: string[];
  previousResponseId?: string;
  outputFormat?: "png" | "jpeg" | "webp";
  imageQuality?: "low" | "medium" | "high" | "auto";
  imageSize?: "1024x1024" | "1024x1536" | "1536x1024" | "auto";
  background?: "transparent" | "opaque" | "auto";
  outputCompression?: number;
  tool?: RequestTool;
}

const recordImageUsage = async (tenantId: string) => {
  try {
    const usage: Partial<UsageLog> = {
      tenant_id: new ObjectId(tenantId),
      provider: ApiKeyProvider.OpenAI,
      model: "gpt-image-1",
      type: UsageType.Image,
    };

    await UsageLogModel.create(usage);
  } catch (error) {
    console.error("Error recording image usage:", error);
  }
};

const recordTextUsage = async (
  tenantId: string,
  responseUsage: ResponseUsage,
) => {
  try {
    const usage: Partial<UsageLog> = {
      tenant_id: new ObjectId(tenantId),
      provider: ApiKeyProvider.OpenAI,
      model: TextModel.Gpt4o,
      type: UsageType.Text,
      input_tokens: responseUsage?.input_tokens ?? 0,
      output_tokens: responseUsage?.output_tokens ?? 0,
    };

    await UsageLogModel.create(usage);
  } catch (error) {
    console.error("Error recording text usage:", error);
  }
};

const createResponseImage: Handler = async (
  event: HandlerEvent,
): Promise<HandlerResponse> => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  const body = JSON.parse(event.body || "{}");

  const {
    tenantId,
    uniqueId,
    prompt,
    // instructions,
    outputFormat = "png",
    imageQuality = "auto",
    imageSize = "auto",
    background = "auto",
    outputCompression = 100,
    previousResponseId = "",
    files = [],
    tool,
  }: CreateResponseParams = body;

  const currentPrompt = await PromptModel.get(body._id);
  if (!prompt) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Prompt is required" }),
    };
  }

  if (!currentPrompt?.prompt) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Prompt is required" }),
    };
  }
  const messages: string[] = [];
  if (currentPrompt?.knowledgebase) {
    const calls = currentPrompt.knowledgebase.map(async (kb) => {
      const instruction = await KnowledgeBaseModel.get(kb.toString());
      return instruction;
    });
    const knowledgebases = await Promise.all(calls);
    knowledgebases.forEach((knowledgebase) => {
      if (knowledgebase?.knowledge_base) {
        messages.push(knowledgebase.knowledge_base);
      }
    });
  }

  const tenant = await TenantModel.get(tenantId);
  if (!tenant) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Tenant does not exist" }),
    };
  }
  const defaultLanguage = tenant.default_language || "en";

  const store = getStore({
    name: NETLIFY_BLOBS_STORE,
    siteID: process.env.SITE_ID,
    token: process.env.NETLIFY_BLOBS_TOKEN,
  });

  try {
    const document: Partial<Response> = {
      id: uniqueId,
      prompt,
      status: ResponseStatus.InProgress,
    };
    await ResponseModel.create(document);

    // Call OpenAI image generation endpoint
    const openAIApiKey = decrypt(tenant.openai_api_key as string);
    const openai = new OpenAI({
      apiKey: openAIApiKey,
    });

    const inputImages: FileInput[] = [];
    const inputFiles: FileInput[] = [];

    const fileDataList = [];
    for (const key of files) {
      const data = await store.get(key);
      fileDataList.push(JSON.parse(data) as FileInput);
    }
    for (const fileData of fileDataList) {
      if (fileData.type.startsWith("image/")) {
        inputImages.push(fileData);
      } else {
        inputFiles.push(fileData);
      }
    }
    //console.log("fileDataList", { inputImages, inputFiles });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enabledTools: any[] = [];
    if (tool === ToolName.Image) {
      enabledTools.push({
        type: "image_generation",
        background,
        output_compression: outputCompression,
        output_format: outputFormat,
        quality: imageQuality,
        size: imageSize,
        partial_images: 1,
      });
    }

    //console.log('instructions', instructions);
    const stream = await openai.responses.create({
      model: "gpt-4o",
      // instructions: ,
      stream: true,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: getInstructionMessage(defaultLanguage),
            },
          ],
        },
        {
          role: "system",
          content: [
            ...messages.map(
              (text: string): ResponseInputText => ({
                type: "input_text",
                text,
              }),
            ),
          ],
        },
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: currentPrompt.prompt,
            },
          ],
        },
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            ...inputImages.map(
              (image: FileInput): ResponseInputImage => ({
                type: "input_image",
                image_url: image.content,
                detail: "auto",
              }),
            ),
            ...inputFiles.map(
              (file: FileInput): ResponseInputFile => ({
                type: "input_file",
                file_data: file.content,
                filename: file.name,
              }),
            ),
          ],
        },
      ],
      ...(enabledTools.length > 0 ? { tools: enabledTools } : {}),
      ...(previousResponseId
        ? { previous_response_id: previousResponseId }
        : {}),
    });

    let imageUrl = "";
    let outputText = "";

    for await (const event of stream) {
      // Emitted when an image generation tool call is actively generating an image (intermediate state).
      if (event.type == "response.image_generation_call.generating") {
        const update: Partial<Response> = {
          tools: [
            {
              name: ToolName.Image,
              image_url: imageUrl,
              is_generated: false,
            },
          ],
        };
        await ResponseModel.update(uniqueId, update);
      }

      // Emitted when the model response is complete.
      if (event.type == "response.completed") {
        const { response } = event;

        const imageData = response.output.filter(
          (output) => output.type === "image_generation_call",
        );
        const messageData = response.output.filter(
          (output) => output.type === "message",
        );

        if (imageData.length) {
          const result = imageData[0].result;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const format = (imageData[0] as any)?.output_format;
          imageUrl = `data:image/${format};base64,${result}`;

          recordImageUsage(tenantId);
        }

        if (messageData.length) {
          outputText =
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (messageData[0]?.content?.[0] as any)?.text || response.output_text;
        }

        if (!imageData.length && messageData.length) {
          recordTextUsage(tenantId, response.usage as ResponseUsage);
        }

        const update: Partial<Response> = {
          status: ResponseStatus.Completed,
          output_text: outputText,
          ...(imageData.length
            ? {
                tools: [
                  {
                    name: ToolName.Image,
                    image_url: imageUrl,
                    is_generated: true,
                  },
                ],
              }
            : {}),
          response_id: response.id,
        };
        await ResponseModel.update(uniqueId, update);

        console.log("GPT image response", JSON.stringify(response));
      }

      console.log("ResponseAPI event ===> ", event);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
      }),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Response API error:", error);

    const { code = "", message = "" } = error;
    const update: Partial<Response> = {
      status: ResponseStatus.Failed,
      error: {
        code,
        message,
      },
    };
    await ResponseModel.update(uniqueId, update);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error?.message || "Internal Server Error",
      }),
    };
  } finally {
    // remove all blobs
    for (const key of files) {
      await store.delete(key);
    }
  }
};

export { createResponseImage as handler };
