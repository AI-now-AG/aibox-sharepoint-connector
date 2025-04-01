import {
  type Handler,
  type HandlerEvent,
  type HandlerResponse,
} from "@netlify/functions";
import { uploadLargeFile, uploadSubtitleLargeFiles } from "./utils/transcribe";
import { updateTask } from "$shared/transcriptionTasks";
import {
  processTranscriptionResult,
  updateStatus,
} from "./utils/batchTranscription";
import { decrypt } from "$utils/secure";
import { FileFormat, type TranscribeRequest } from "$types/TranscribeRequest";
import TenantModel, { type Tenant } from "$data/models/tenant.model";
import UserModel, { type User } from "$data/models/user.model";
import { AudioCategory, TenantFeature } from "$types/TenantFeature";

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
      tenantId: string;
      userId: string;
      uniqueName?: string;
      uploadUrl?: string;
      folderName?: string;
      enableDiarization?: boolean;
      fileURL?: string;
      encryptedSpeechKey?: string;
      typedCategory?: AudioCategory;
      selectedFileFormat?: FileFormat[];
      isShowImprovedTextPreview?: boolean;
    };

    const {
      tenantId,
      userId,
      uniqueName,
      uploadUrl,
      folderName,
      enableDiarization,
      fileURL,
      encryptedSpeechKey,
      typedCategory,
      selectedFileFormat,
      isShowImprovedTextPreview,
    } = body;

    if (
      !tenantId ||
      !userId ||
      !uniqueName ||
      !folderName ||
      !uploadUrl ||
      !fileURL ||
      !encryptedSpeechKey ||
      !typedCategory
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid file upload data" }),
      };
    }
    if (typedCategory === AudioCategory.SubtitleLarge && !selectedFileFormat) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid file upload data" }),
      };
    }

    const subscriptionKey = decrypt(
      encryptedSpeechKey || process.env.AZURE_LARGE_SPEECH_KEY!,
    );

    const transcriptionData = await processTranscriptionResult(
      uniqueName,
      enableDiarization,
      fileURL,
      subscriptionKey,
    );

    let outputURLs: { [key: string]: string } = {};
    if (typedCategory === AudioCategory.SubtitleLarge) {
      updateStatus({ uniqueName, name: "Creating Subtitle files" });
      const tenant = await TenantModel.get(tenantId);
      const user = await UserModel.get(userId);

      const transcribeParams = createTranscribeRequest(
        folderName,
        uniqueName,
        uploadUrl,
        tenant || undefined,
        user || undefined,
        typedCategory,
        selectedFileFormat,
        isShowImprovedTextPreview,
        enableDiarization,
      );

      const openAIApiKey = decrypt(
        transcribeParams.openaiEncryptedApiKey || process.env.OPENAI_API_KEY!,
      );
      transcribeParams.openAIApiKey = openAIApiKey;

      const azureOpenAIApiKey = decrypt(
        transcribeParams.encryptedApiKey || process.env.AZURE_OPENAI_API_KEY2!,
      );
      transcribeParams.azureOpenAIApiKey = azureOpenAIApiKey;

      const azureSpeechKey = decrypt(
        transcribeParams.encryptedSpeechKey ||
          process.env.AZURE_LARGE_SPEECH_KEY!,
      );
      transcribeParams.speechKey = azureSpeechKey;

      outputURLs = await uploadSubtitleLargeFiles(
        uploadUrl,
        folderName,
        transcriptionData.jsonData,
        transcriptionData.transcriptionText,
        selectedFileFormat,
        isShowImprovedTextPreview,
        transcribeParams,
      );
      updateStatus({ uniqueName, name: "Subtitle files created" });
    } else {
      outputURLs = await uploadLargeFile(
        uploadUrl,
        folderName,
        transcriptionData.jsonData,
        transcriptionData.transcriptionText,
        tenantId,
      );
    }

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
        transcription: transcriptionData.transcriptionText,
      }),
    };
  } catch (error) {
    const body = JSON.parse(event.body || "{}") as { uniqueName?: string };
    const uniqueName = body.uniqueName || "unknown_task";

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred.";

    try {
      await updateTask(uniqueName, {
        status: "failed",
        error: errorMessage,
      });
    } catch (updateError) {
      console.error(
        `Failed to update task status for ${uniqueName}:`,
        updateError,
      );
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ message: errorMessage }),
    };
  }
};

function createTranscribeRequest(
  folderName: string,
  uniqueName: string,
  tempUploadUrl: string,
  tenant?: Tenant,
  user?: User,
  typedCategory?: AudioCategory,
  selectedFileFormat?: FileFormat[],
  showTextPreviewChecked: boolean = false,
  isDiarizationEnabled?: boolean,
): TranscribeRequest {
  const textPromptsProvider = tenant?.included_features?.find(
    (item: { name: TenantFeature }) => item.name == TenantFeature.AudioToText,
  );
  const provider = textPromptsProvider?.provider;
  return {
    folderName: folderName,
    fileName: uniqueName,
    uniqueName: uniqueName,
    uploadUrl: tempUploadUrl,
    tenantId: tenant?._id.toString() || "",
    userId: user?._id.toString() || "",
    category: typedCategory,
    selectedFileFormat: selectedFileFormat,
    isShowImprovedTextPreview: showTextPreviewChecked,
    apiKeyProvider: provider,
    openaiEncryptedApiKey: tenant?.openai_api_key || undefined,
    encryptedApiKey: tenant?.azure_openai_api_key || undefined,
    azureOpenAIInstanceName: tenant?.azure_openai_instance_name || undefined,
    azureOpenAIEndpoint: tenant?.azure_openai_endpoint || undefined,
    azureOpenAIWhisperModel: tenant?.azure_openai_whisper_model || undefined,
    azureOpenAIChatModel: tenant?.azure_openai_chat_model || undefined,
    encryptedSpeechKey: tenant?.speech_api_key || undefined,
    speechRegion: tenant?.speech_region || undefined,
    isDiarizationEnabled: isDiarizationEnabled,
  };
}

export { postAudioProProcess as handler };
