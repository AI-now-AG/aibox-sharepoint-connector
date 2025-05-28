import {
  type Handler,
  type HandlerEvent,
  type HandlerResponse,
} from "@netlify/functions";
import { OpenAI } from "openai";
import { decrypt } from "$utils/secure";
import ImageJobModel, { type ImageJob } from "$data/models/imageJob.model";

const openAIApiKey = decrypt(process.env.OPENAI_API_KEY!);
const openai = new OpenAI({
  apiKey: openAIApiKey,
});

const createGPTImage: Handler = async (
  event: HandlerEvent,
): Promise<HandlerResponse> => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");

    const {
      jobId,
      prompt,
      imageSize = "1024x1024",
      imageQuality = 80,
      compressionLevel = 75,
      outputFormat = "PNG",
      background = "transparent",
    } = body;

    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Prompt is required" }),
      };
    }

    // Call OpenAI image generation endpoint
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      tools: [{ type: "image_generation" }],
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
    const _outputFormat = imageData[0].output_format;
    const imageUrl = `data:image/${_outputFormat};base64,${_ouputResult}`;

    const imageJob: Partial<ImageJob> = {
      job_id: jobId,
      prompt,
      status: "completed",
      imageUrl,
      model: response.model,
      size: imageData[0]?.size,
    };
    await ImageJobModel.create(imageJob);

    return {
      statusCode: 200,
      body: JSON.stringify({
        result: response.output,
      }),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Image generation error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error?.message || "Internal Server Error",
      }),
    };
  }
};

export { createGPTImage as handler };
