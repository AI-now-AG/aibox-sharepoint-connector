import {
  type Handler,
  type HandlerEvent,
  type HandlerResponse,
} from "@netlify/functions";
import {
  BlobSASPermissions,
  BlobServiceClient,
  type BlobDownloadResponseParsed,
} from "@azure/storage-blob";
import {
  transcribeUsingOpenAI,
  transcribeUsingAzureOpenAI,
} from "./utils/transcribe";
import { decrypt } from "$utils/secure";
import { createTask, updateTask } from "$shared/transcriptionTasks";
import {
  TranscriptionType,
  type TranscribeRequest,
  type TranscriptionResult,
} from "$types/TranscribeRequest";
import { ObjectId } from "mongodb";
import ffmpeg from "fluent-ffmpeg";
import stream, { PassThrough } from "stream";
import path from "path";
import os from "os";
import { Readable } from "stream";
import { createWriteStream, unlink, existsSync, mkdirSync } from "fs";
import { v4 as uuidv4 } from "uuid";

// const ffmpegPath = path.join(process.cwd(), 'bin', 'osx', 'ffmpeg');
let ffmpegPath: string;
const platform = os.platform();
const arch = os.arch();

if (platform === "darwin" && arch === "arm64") {
  ffmpegPath = path.join(__dirname, "..", "bin", "osx", "ffmpeg");
} else if (platform === "linux" && arch === "x64") {
  ffmpegPath = path.join(__dirname, "..", "bin", "linux", "ffmpeg");
} else {
  throw new Error(`Unsupported platform: ${platform} (${arch})`);
}

const transcribeAudio: Handler = async (
  event: HandlerEvent,
): Promise<HandlerResponse> => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  try {
    const transcribeParams: TranscribeRequest = JSON.parse(event.body || "{}");
    const {
      fileName,
      uniqueName,
      uploadUrl,
      transcriptionType,
      openaiEncryptedApiKey,
      encryptedApiKey,
      encryptedSpeechKey,
    } = transcribeParams;

    if (!fileName || !uploadUrl || !transcriptionType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid file upload data" }),
      };
    }

    const openAIApiKey = decrypt(
      openaiEncryptedApiKey || process.env.OPENAI_API_KEY!,
    );
    transcribeParams.openAIApiKey = openAIApiKey;

    const azureOpenAIApiKey = decrypt(
      encryptedApiKey || process.env.AZURE_OPENAI_API_KEY2!,
    );
    transcribeParams.azureOpenAIApiKey = azureOpenAIApiKey;

    const azureSpeechKey = decrypt(
      encryptedSpeechKey || process.env.AZURE_LARGE_SPEECH_KEY!,
    );
    transcribeParams.speechKey = azureSpeechKey;

    createTask(uniqueName, {
      tenant_id: new ObjectId(transcribeParams.tenantId),
      creator_id: new ObjectId(transcribeParams.userId),
      audio_url: transcribeParams.uploadUrl,
      status: "processing",
    });
    let transcriptionResult: TranscriptionResult = {
      success: false,
      data: null,
      error: null,
    };
    if (transcriptionType === TranscriptionType.Largefile) {
      if (transcribeParams.isDiarizationEnabled) {
        const newBlobFileUrl = await convertStereoToMono(
          uploadUrl,
          transcriptionType,
          transcribeParams.folderName,
          uniqueName,
        );
        if (newBlobFileUrl) {
          await updateTask(uniqueName, {
            status: "processing",
            output_url: newBlobFileUrl,
          });
          transcribeParams.uploadUrl = newBlobFileUrl;
          transcriptionResult =
            await transcribeUsingAzureOpenAI(transcribeParams);
        } else {
          return {
            statusCode: 500,
            body: JSON.stringify({
              message: "Error in conversion of audio",
            }),
          };
        }
      } else {
        await updateTask(uniqueName, {
          status: "processing",
          output_url: transcribeParams.uploadUrl,
        });
        transcriptionResult =
          await transcribeUsingAzureOpenAI(transcribeParams);
      }
    } else {
      const fileBuffer = await downloadFileFromBlob(
        uploadUrl,
        transcriptionType,
      );
      transcribeParams.audioBuffer = fileBuffer;
      transcriptionResult = await transcribeUsingOpenAI(transcribeParams);
    }
    if (!transcriptionResult.success) {
      await updateTask(uniqueName, {
        status: "failed",
        error:
          transcriptionResult.error || "Unknown error during transcription.",
      });
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: transcriptionResult.error,
        }),
      };
    } else {
      if (transcriptionType !== TranscriptionType.Largefile) {
        await updateTask(uniqueName, {
          status: "completed",
          txtUrl: transcriptionResult.data?.urls["txt"],
          srtUrl: transcriptionResult.data?.urls["srt"] ?? "",
          assUrl: transcriptionResult.data?.urls["ass"] ?? "",
        });
      }
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "File uploaded and transcribed successfully",
          transcription: transcriptionResult.data,
        }),
      };
    }
  } catch (error) {
    console.error("Error while transcribing:" + error);
    const { uniqueName = "unknown_task" } = JSON.parse(event.body || "{}");

    if (error instanceof Error) {
      await updateTask(uniqueName, {
        status: "failed",
        error: error.message,
      });
    } else {
      await updateTask(uniqueName, {
        status: "failed",
        error: "Unknown error during transcription.",
      });
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        message:
          error instanceof Error
            ? error.message
            : "Unknown error during transcription",
      }),
    };
  }
};

async function convertStereoToMono(
  blobUrl: string,
  typedTranscriptionType: TranscriptionType,
  folderName: string,
  uniqueName: string,
): Promise<string | null> {
  const storageURLString =
    typedTranscriptionType === TranscriptionType.Largefile
      ? process.env.AZURE_BLOB_LARGE_STORAGE_NAME || ""
      : process.env.AZURE_BLOB_STORAGE_NAME || "";

  const containerName =
    typedTranscriptionType === TranscriptionType.Largefile
      ? process.env.AZURE_LARGE_CONTAINER_NAME || "transcribe-container"
      : process.env.AZURE_CONTAINER_NAME || "transcribecontainer";

  if (!storageURLString || !containerName) {
    console.error("Azure storage configuration is missing.");
    return null;
  }

  const blobServiceClient =
    BlobServiceClient.fromConnectionString(storageURLString);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  const downloadBlockBlob = await downloadFile(blobUrl, typedTranscriptionType);
  const downloadBlockBlobResponse =
    (await downloadBlockBlob.readableStreamBody) as Readable;
  if (!downloadBlockBlobResponse) {
    throw new Error("Failed to retrieve blob stream");
  }

  const filename = blobUrl.includes("?") ? blobUrl.split("?")[0] : blobUrl;
  const fileExtension = filename.split(".").pop();

  if (!fileExtension) {
    console.error(`Unsupported file extension: ${fileExtension}`);
    return null;
  }

  const newFormat = fileExtension === "m4a" ? "mp3" : fileExtension;
  const convertedBlobName = `${folderName}/${uniqueName}-mono.${newFormat}`;
  const monoBlobClient = containerClient.getBlockBlobClient(convertedBlobName);
  const outputStream = new stream.PassThrough();
  // downloadBlockBlobResponse.pipe(outputStream);
  const uploadPromise = monoBlobClient.uploadStream(
    outputStream,
    4 * 1024 * 1024,
    5,
  );

  try {
    console.log("Starting FFmpeg processing and upload...");
    const processingPromise = processWithFFmpeg(
      downloadBlockBlobResponse,
      outputStream,
      fileExtension,
    );
    await Promise.all([processingPromise, uploadPromise]);
    return monoBlobClient.generateSasUrl({
      permissions: BlobSASPermissions.parse("r"),
      expiresOn: new Date(new Date().getTime() + 6 * 60 * 60 * 1000), // Expire in 6 hours
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("FFmpeg error:", error.message);
      await updateTask(uniqueName, {
        status: "failed",
        error: error.message,
      });
    } else {
      console.error("Unknown error occurred:", error);
    }
    return null;
  } finally {
    outputStream.end();
  }
}

async function processWithFFmpeg(
  inputStream: Readable,
  outputStream: PassThrough,
  format: string,
): Promise<void> {
  const newFormat = format === "m4a" ? "mp3" : format;
  const tempDir = path.join("/tmp", "audio");
  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true });
    console.log("Created directory:", tempDir);
  }
  const tempFilePath = path.join(tempDir, `${uuidv4()}.${format}`);
  await saveStreamToFile(inputStream, tempFilePath);

  const ffmpegProcess = ffmpeg()
    .setFfmpegPath(ffmpegPath)
    .input(tempFilePath)
    .audioChannels(1)
    //.audioBitrate("192k")
    .audioCodec("libmp3lame")
    .format(newFormat)
    .output(outputStream);
  // .on("start", (commandLine) => {
  //   console.log("FFmpeg command:", commandLine);
  // })
  // .on("stderr", (stderrLine) => {
  //   console.error("FFmpeg stderr:", stderrLine);
  // })
  // .on("progress", (progress) => {
  //   console.log("Processing:");
  //   console.log(progress);
  // });

  ffmpegProcess.run();

  try {
    await new Promise<void>((resolve, reject) => {
      ffmpegProcess
        .on("error", (err) => {
          console.error("FFmpeg error:", err.message);
          reject(err);
        })
        .on("end", () => {
          console.log("FFmpeg processing completed");
          resolve();
        });
    });
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`FFmpeg processing failed: ${err.message}`);
    } else {
      throw new Error("FFmpeg processing failed: Unknown error");
    }
  } finally {
    unlink(tempFilePath, (err) => {
      if (err) {
        console.error("Failed to delete temporary file:", err.message);
      } else {
        console.log("Temporary file deleted:", tempFilePath);
      }
    });
  }
}

async function saveStreamToFile(
  stream: Readable,
  filePath: string,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const writeStream = createWriteStream(filePath);
    stream
      .pipe(writeStream)
      .on("finish", () => {
        console.log("Stream saved to file:", filePath);
        resolve();
      })
      .on("error", (err) => {
        console.error("Failed to save stream:", err.message);
        reject(err);
      });
  });
}

async function downloadFileFromBlob(
  blobUrl: string,
  typedTranscriptionType: TranscriptionType,
): Promise<Buffer> {
  try {
    const downloadBlockBlobResponse = await downloadFile(
      blobUrl,
      typedTranscriptionType,
    );
    const downloaded = await streamToBuffer(
      downloadBlockBlobResponse.readableStreamBody!,
    );

    return downloaded;
  } catch (error) {
    console.error("Error in downloadFileFromBlob:", error);
    throw new Error("Failed to download file from Blob Storage.");
  }
}

async function downloadFile(
  blobUrl: string,
  typedTranscriptionType: TranscriptionType,
): Promise<BlobDownloadResponseParsed> {
  const storageURLString =
    typedTranscriptionType === TranscriptionType.Largefile
      ? process.env.AZURE_BLOB_LARGE_STORAGE_NAME || ""
      : process.env.AZURE_BLOB_STORAGE_NAME || "";
  const blobServiceClient =
    BlobServiceClient.fromConnectionString(storageURLString);

  const url = new URL(blobUrl);
  const blobPath = url.pathname.split("/");
  const containerName = blobPath[1];
  const blobName = blobPath.slice(2).join("/");

  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobClient = containerClient.getBlobClient(blobName);

  return await blobClient.download(0);
}

async function streamToBuffer(
  readableStream: NodeJS.ReadableStream,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on("data", (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on("error", reject);
  });
}

export { transcribeAudio as handler };
