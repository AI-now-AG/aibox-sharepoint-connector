import {
  type Handler,
  type HandlerEvent,
  type HandlerResponse,
} from "@netlify/functions";
import { OpenAI } from "openai";
import { decrypt } from "$utils/secure";
import ImageTaskModel, { type ImageTask } from "$data/models/imageTask.model";
import TenantModel from "$data/models/tenant.model";

const gptImageGenerate: Handler = async (
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
    outputFormat = "png",
    imageQuality = "medium",
    imageSize = "1024x1024",
    background = "transparent",
    outputCompression = 100,
    previousResponseId = "",
  } = body;

  if (!prompt) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Prompt is required" }),
    };
  }

  const tenant = await TenantModel.get(tenantId);
  if (!tenant) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Tenant does not exist" }),
    };
  }

  try {
    const document: Partial<ImageTask> = {
      id: uniqueId,
      prompt,
      status: "pending",
    };
    await ImageTaskModel.create(document);

    // Call OpenAI image generation endpoint
    const openAIApiKey = decrypt(tenant.openai_api_key as string);
    const openai = new OpenAI({
      apiKey: openAIApiKey,
    });
    const response = await openai.responses.create({
      model: "gpt-4o",
      input: prompt,
      tools: [
        {
          type: "image_generation",
          background,
          output_compression: outputCompression,
          output_format: outputFormat,
          quality: imageQuality,
          size: imageSize,
        },
      ],
      ...(previousResponseId
        ? { previous_response_id: previousResponseId }
        : {}),
    });

    const imageData = response.output.filter(
      (output) => output.type === "image_generation_call",
    );
    if (imageData.length == 0) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Internal Server Error",
        }),
      };
    }

    const _ouputResult = imageData[0].result;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const _outputFormat = (imageData[0] as any)?.output_format;
    const imageUrl = `data:image/${_outputFormat};base64,${_ouputResult}`;

    const update: Partial<ImageTask> = {
      status: "completed",
      output_text: response.output_text,
      image_url: imageUrl,
      response_id: response.id,
    };
    await ImageTaskModel.update(uniqueId, update);

    console.log("GPT image response", response);
    return {
      statusCode: 200,
      body: JSON.stringify({
        result: response.output,
      }),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Image generation error:", error);

    const { code, message = "" } = error;
    const update: Partial<ImageTask> = {
      status: "error",
      error: {
        code,
        message,
      },
    };
    await ImageTaskModel.update(uniqueId, update);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error?.message || "Internal Server Error",
      }),
    };
  }
};

export { gptImageGenerate as handler };
