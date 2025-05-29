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
      imageQuality = "medium",
      compressionLevel = 100,
      outputFormat = "PNG",
      background = "transparent",
    } = body;

    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Prompt is required" }),
      };
    }

    const jobData: Partial<ImageJob> = {
      job_id: jobId,
      prompt,
      status: "pending",
    };
    const imageJob = await ImageJobModel.create(jobData);

    // Call OpenAI image generation endpoint
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      tools: [
        {
          type: "image_generation",
          background,
          output_compression: compressionLevel,
          output_format: outputFormat,
          quality: imageQuality,
          size: imageSize,
        },
      ],
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

    const updateJob: Partial<ImageJob> = {
      status: "completed",
      imageUrl,
      model: response.model,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      size: (imageData[0] as any)?.size,
    };
    await ImageJobModel.update(imageJob.insertedId, updateJob);

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
