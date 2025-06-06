import {
  type Handler,
  type HandlerEvent,
  type HandlerResponse,
} from "@netlify/functions";
import { OpenAI } from "openai";
import { ObjectId } from "mongodb";
import { decrypt } from "$utils/secure";
import { Status } from "$types/ImageTask";
import type { FileInput } from "$types/FileInput";
import type { UploadedFile, ParsedForm } from "$types/FormData";
import { ApiKeyProvider } from "$types/TenantFeature";
import ImageTaskModel, { type ImageTask } from "$data/models/imageTask.model";
import TenantModel from "$data/models/tenant.model";
import { UsageType } from "$types/UsageTracking";
import UsageLogModel, { type UsageLog } from "$data/models/usageLog.model";
import type {
  ResponseInputFile,
  ResponseInputImage,
} from "openai/resources/responses/responses";
import Busboy from "busboy";
import { Readable } from "stream";

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

const parseMultipartForm = (event: HandlerEvent): Promise<ParsedForm> => {
  return new Promise((resolve, reject) => {
    const fields: Record<string, string | number> = {};
    const files: UploadedFile[] = [];

    const contentType =
      event.headers["content-type"] || event.headers["Content-Type"];
    if (!contentType?.includes("multipart/form-data")) {
      return reject(new Error("Invalid content-type"));
    }

    const bb = Busboy({
      headers: { "content-type": contentType },
    });

    bb.on("field", (fieldname: string, value: string) => {
      const parsedValue = isNaN(Number(value)) ? value : Number(value);
      fields[fieldname] = parsedValue;
    });

    bb.on(
      "file",
      (
        fieldname: string,
        file: NodeJS.ReadableStream,
        info: {
          filename: string;
          encoding: string;
          mimeType: string;
        },
      ) => {
        const { filename, encoding, mimeType } = info;
        const chunks: Buffer[] = [];

        file.on("data", (chunk: Buffer) => {
          chunks.push(chunk);
        });

        file.on("end", () => {
          const buffer = Buffer.concat(chunks);
          files.push({
            fieldname,
            filename,
            encoding,
            mimeType,
            buffer,
          });

          console.log("files", files);
        });
      },
    );

    bb.on("error", reject);

    bb.on("finish", () => {
      resolve({ fields, files });
    });

    const body = Buffer.from(
      event.body || "",
      event.isBase64Encoded ? "base64" : "utf8",
    );

    Readable.from(body).pipe(bb);
  });
};

const gptImageGenerate: Handler = async (
  event: HandlerEvent,
): Promise<HandlerResponse> => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  const { fields, files } = await parseMultipartForm(event);
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
  } = fields;

  if (!tenantId || !uniqueId || !prompt) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing required fields" }),
    };
  }

  const tenant = await TenantModel.get(tenantId);
  if (!tenant) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Tenant does not exist" }),
    };
  }

  // Prepare inputImages and inputFiles from uploaded files
  const inputImages: FileInput[] = [];
  const inputFiles: FileInput[] = [];
  for (const file of files) {
    const base64Content = `data:${file.mimeType};base64,${file.buffer.toString("base64")}`;
    const fileObj: FileInput = {
      name: file.filename,
      content: base64Content,
      type: file.mimeType,
    };
    if (file.mimeType.startsWith("image/")) {
      inputImages.push(fileObj);
    } else {
      inputFiles.push(fileObj);
    }
  }

  try {
    // Create task
    const document: Partial<ImageTask> = {
      id: uniqueId,
      prompt,
      status: Status.InProgress,
    };
    await ImageTaskModel.create(document);

    // Call OpenAI image generation endpoint
    const openAIApiKey = decrypt(tenant.openai_api_key as string);
    const openai = new OpenAI({
      apiKey: openAIApiKey,
    });

    const response = await openai.responses.create({
      model: "gpt-4o",
      //input: prompt,
      input: [
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
    const messageData = response.output.filter(
      (output) => output.type === "message",
    );

    let imageUrl = "";
    let outputText = "";

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

    const update: Partial<ImageTask> = {
      status: Status.Completed,
      output_text: outputText,
      image_url: imageUrl,
      response_id: response.id,
    };
    await ImageTaskModel.update(uniqueId, update);

    console.log("GPT image response", { response, outputText });
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
      status: Status.Failed,
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
