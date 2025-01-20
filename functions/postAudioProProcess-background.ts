import {
  type Handler,
  type HandlerEvent,
  type HandlerResponse,
} from "@netlify/functions";
import { uploadLargeFile } from "./utils/transcribe";
import { updateTask } from "$shared/transcriptionTasks";
import type { TranscriptionResponse } from "$utils/Speech/SpeechResponse";
import { processTranscriptionResult } from "./utils/batchTranscription";
import { decrypt } from "$utils/secure";

const postAudioProProcess: Handler = async (
  event: HandlerEvent,
): Promise<HandlerResponse> => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }
  console.log("postAudioProProcess called");
  try {
    const body = JSON.parse(event.body || "{}") as {
      uniqueName: string;
      uploadUrl: string;
      folderName: string;
      enableDiarization: boolean;
      fileURL: string;
      encryptedSpeechKey: string;
    };
    console.log("postAudioProProcess body", body);
    const {
      uniqueName,
      uploadUrl,
      folderName,
      enableDiarization,
      fileURL,
      encryptedSpeechKey,
    } = body;

    if (!uniqueName || !folderName || !uploadUrl || !fileURL || !encryptedSpeechKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid file upload data" }),
      };
    }

    const subscriptionKey = decrypt(
      encryptedSpeechKey || process.env.AZURE_LARGE_SPEECH_KEY!,
    );
    console.log("postAudioProProcess subscriptionKey", subscriptionKey);
    const transcriptionData = await processTranscriptionResult(
      uniqueName,
      enableDiarization,
      fileURL,
      subscriptionKey,
    );

    console.log("postAudioProProcess uniqueName", uniqueName);
    const outputURLs = await uploadLargeFile(
      uploadUrl,
      folderName,
      transcriptionData.jsonData,
      transcriptionData.transcriptionText,
    );
    console.log("postAudioProProcess outputURLs", outputURLs);
    await updateTask(uniqueName, {
      status: "completed",
      txtUrl: outputURLs.txt,
      srtUrl: outputURLs.srt || "",
      assUrl: outputURLs.ass || "",
    });
    console.log("data-----");
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "File uploaded successfully",
        transcription: transcriptionData.transcriptionText,
      }),
    };
  } catch (error) {
    console.log("Error------:", error);
    console.error("Error while processing post-audio:", error);

    const body = JSON.parse(event.body || "{}") as { uniqueName?: string };
    const uniqueName = body.uniqueName || "unknown_task";

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error during post-audio process.";
    console.log("error Message::::", errorMessage);
    await updateTask(uniqueName, {
      status: "failed",
      error: errorMessage,
    });
    console.log("error:------");
    return {
      statusCode: 500,
      body: JSON.stringify({ message: errorMessage }),
    };
  }
};

export { postAudioProProcess as handler };
