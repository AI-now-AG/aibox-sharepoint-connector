import {
  type Handler,
  type HandlerEvent,
  type HandlerResponse,
} from "@netlify/functions";
import { uploadLargeFile } from "./utils/transcribe";
import { updateTask } from "$shared/transcriptionTasks";
import type { TranscriptionResponse } from "$utils/Speech/SpeechResponse";

const postAudioProProcess: Handler = async (
  event: HandlerEvent,
): Promise<HandlerResponse> => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}") as {
      uniqueName: string;
      uploadUrl: string;
      folderName: string;
      jsonData: TranscriptionResponse;
      transcriptionText: string;
    };

    const { uniqueName, uploadUrl, folderName, jsonData, transcriptionText } =
      body;

    if (!uniqueName || !folderName || !uploadUrl || !jsonData) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid file upload data" }),
      };
    }

    const outputURLs = await uploadLargeFile(
      uploadUrl,
      folderName,
      jsonData,
      transcriptionText,
    );

    await updateTask(uniqueName, {
      status: "completed",
      txtUrl: outputURLs.txt,
      srtUrl: outputURLs.srt || "",
      assUrl: outputURLs.ass || "",
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "File uploaded successfully",
        transcription: transcriptionText,
      }),
    };
  } catch (error) {
    console.error("Error while processing post-audio:", error);

    const body = JSON.parse(event.body || "{}") as { uniqueName?: string };
    const uniqueName = body.uniqueName || "unknown_task";

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error during post-audio process.";

    await updateTask(uniqueName, {
      status: "failed",
      error: errorMessage,
    });

    return {
      statusCode: 500,
      body: JSON.stringify({ message: errorMessage }),
    };
  }
};

export { postAudioProProcess as handler };
