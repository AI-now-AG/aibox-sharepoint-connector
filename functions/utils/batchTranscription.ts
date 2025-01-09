// Create a Batch Transcription Task

import type { PollStatusResponse } from "$utils/Speech/PollStatusResponse";
import type { TranscriptionRequestBody } from "$utils/Speech/SpeechRequest";
import type {
  RecognizedPhrase,
  TranscriptionResponse,
} from "$utils/Speech/SpeechResponse";
import type { GetTranscriptionResultResponse } from "$utils/Speech/SpeechResultResponse";
import {
  type BatchTask,
  updateTask,
  getTask,
  BatchStatus,
} from "$shared/transcriptionTasks";
import {
  BlobSASPermissions,
  BlobServiceClient,
  ContainerSASPermissions,
  generateBlobSASQueryParameters,
  SASProtocol,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

//const subscriptionKey = process.env.AZURE_LARGE_SPEECH_KEY || "";

// Step 1: Process Transcription Workflow
export async function processTranscription(
  blobUrl: string,
  uniqueName: string,
  subscriptionKey: string,
  speechRegion: string,
  enableDiarization: boolean = false,
  numberOfMaxSpeakers: number = 2,
  //): Promise<{ transcriptionText: string }> {
): Promise<{ jsonData: TranscriptionResponse; transcriptionText: string }> {
  try {
    // Step 1: Create transcription task
    updateStatus(
      uniqueName,
      "Batch task initiated",
      undefined,
      enableDiarization,
      numberOfMaxSpeakers,
    );
    const taskResponse = await createTranscriptionTask(
      blobUrl,
      enableDiarization,
      numberOfMaxSpeakers,
      uniqueName,
      subscriptionKey,
      speechRegion,
    );
    console.log("Created trancription task:" + taskResponse.self);
    updateStatus(
      uniqueName,
      "Batch task created",
      taskResponse.status,
      enableDiarization,
      numberOfMaxSpeakers,
      taskResponse.self,
      taskResponse.properties.destinationContainerUrl,
    );

    const transcriptionData = await pollingAndStatus(
      taskResponse.self,
      uniqueName,
      enableDiarization,
      subscriptionKey,
    );

    //return { transcriptionText: "" };
    return transcriptionData;
  } catch (error) {
    updateStatus(
      uniqueName,
      "Batch task failed",
      "Failed",
      undefined,
      undefined,
      undefined,
      undefined,
      `${error}`,
    );
    console.error("Error processing transcription:", error);
    throw error;
  }
}

// Step 2: Create Transcription Task
export async function createTranscriptionTask(
  blobUrl: string,
  enableDiarization: boolean = false,
  numberOfMaxSpeakers: number = 2,
  uniqueName: string,
  subscriptionKey: string,
  speechRegion: string,
): Promise<PollStatusResponse> {
  const url = `https://${speechRegion}.api.cognitive.microsoft.com/speechtotext/v3.2/transcriptions`;
  const destinationContainerUrl = await createDestinationContainerUrl();
  const body: TranscriptionRequestBody = {
    displayName: "My Transcription",
    locale: "de-ch",
    contentUrls: [blobUrl],
    properties: {
      wordLevelTimestampsEnabled: false,
      displayFormWordLevelTimestampsEnabled: true,
      diarizationEnabled: enableDiarization,
      languageIdentification: {
        candidateLocales: ["fr-ch", "it-ch", "en-us", "en-gb", "de-ch"],
      },
      punctuationMode: "DictatedAndAutomatic",
      profanityFilterMode: "None",
      destinationContainerUrl: destinationContainerUrl,
    },
    customProperties: {},
  };

  if (enableDiarization) {
    body.properties.diarization = {
      speakers: {
        minCount: 1,
        maxCount: numberOfMaxSpeakers,
      },
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": subscriptionKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorDetails = await response.json();
    updateStatus(
      uniqueName,
      "Create Batch task failed",
      "Failed",
      undefined,
      undefined,
      undefined,
      undefined,
      `${errorDetails}`,
    );
    throw new Error(
      `Failed to create batch transcription: ${errorDetails.message}`,
    );
  }

  const data: PollStatusResponse = await response.json();
  return data;
}

async function createDestinationContainerUrl() {
  const storageAccountName =
    process.env.AZURE_LARGE_STORAGE_ACCOUNT_NAME || "aiboxstore"; // Add your storage account name
  const storageAccountKey = process.env.AZURE_LARGE_STORAGE_ACCOUNT_KEY || ""; // Add your storage account key
  const containerName = "transcription-jobs";

  const credential = new StorageSharedKeyCredential(
    storageAccountName,
    storageAccountKey,
  );
  const blobServiceClient = new BlobServiceClient(
    `https://${storageAccountName}.blob.core.windows.net`,
    credential,
  );

  const containerClient = blobServiceClient.getContainerClient(containerName);
  await containerClient.createIfNotExists();

  //const folderName = "TranscribeData";
  // const placeholderBlobName = `${folderName}/.placeholder`; // Placeholder file in folder
  // const placeholderBlobClient =
  //   containerClient.getBlockBlobClient(placeholderBlobName);

  // // Check if the folder (placeholder blob) exists, if not, create it
  // const exists = await placeholderBlobClient.exists();
  // if (!exists) {
  //   await placeholderBlobClient.upload("", 0); // Upload an empty file
  // }

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 1); // SAS token valid for a day

  // Generate SAS token for the folder (container + folder path)
  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      permissions: ContainerSASPermissions.parse("rwl"), // Read, Write, List permissions
      startsOn: new Date(),
      expiresOn: expiryDate,
      protocol: SASProtocol.HttpsAndHttp,
    },
    credential,
  ).toString();

  // const folderSasUrl = `${containerClient.url}/${folderName}?${sasToken}`;
  const folderSasUrl = `${containerClient.url}?${sasToken}`;

  return folderSasUrl;
}

export async function pollingAndStatus(
  taskUrl: string,
  uniqueName: string,
  enableDiarization: boolean = false,
  subscriptionKey: string,
): Promise<{ jsonData: TranscriptionResponse; transcriptionText: string }> {
  try {
    // Step 2: Poll transcription task status
    updateStatus(uniqueName, "Polling initiated");
    const pollResponse = await pollTranscriptionTask(
      taskUrl,
      uniqueName,
      subscriptionKey,
    );

    const transcriptionData = await processTranscriptionResult(
      uniqueName,
      enableDiarization,
      pollResponse.links.files,
      subscriptionKey,
    );
    return transcriptionData;
  } catch (error) {
    updateStatus(
      uniqueName,
      "Batch task failed",
      "Failed",
      undefined,
      undefined,
      undefined,
      undefined,
      `${error}`,
    );
    console.error("Error processing transcription:", error);
    throw error;
  }
}

// Step 3: Poll for Transcription Task Completion
export async function pollTranscriptionTask(
  transcriptionIdUrl: string,
  uniqueName: string,
  subscriptionKey: string,
): Promise<PollStatusResponse> {
  while (true) {
    const task = await getTask(uniqueName);
    const currentBatch = getCurrentBatchStatus(task?.batchUpdate);

    const data = await fetchTranscriptionStatus(
      transcriptionIdUrl,
      subscriptionKey,
    );

    switch (data.status) {
      case BatchStatus.Succeeded:
        if (!currentBatch.succeeded) {
          await updateTaskStatus(uniqueName, data, "Polling completed.");
        }
        return data;

      case BatchStatus.Failed:
        if (!currentBatch.failed) {
          await updateTaskStatus(
            uniqueName,
            data,
            `Poll Batch task ${data.status}`,
          );
        }
        throw new Error(
          `Poll transcription task failed: ${data.properties.error?.message}`,
        );

      case BatchStatus.Running:
        if (!currentBatch.running) {
          await updateTaskStatus(
            uniqueName,
            data,
            `Poll Batch task ${data.status}`,
          );
        }
        //return data; // End the function after processing the running state
        break;
      default:
        console.warn(`Unexpected batch status: ${data.status}`);
        //return data; // Handle unexpected status
        break;
    }
    // Wait 5 seconds before polling again
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

function getCurrentBatchStatus(batchUpdate: BatchTask[] = []) {
  return {
    running: batchUpdate.find((batch) => batch.status === BatchStatus.Running),
    succeeded: batchUpdate.find(
      (batch) => batch.status === BatchStatus.Succeeded,
    ),
    failed: batchUpdate.find((batch) => batch.status === BatchStatus.Failed),
  };
}

async function fetchTranscriptionStatus(
  url: string,
  subscriptionKey: string,
): Promise<PollStatusResponse> {
  const response = await fetch(url, {
    method: "GET",
    headers: { "Ocp-Apim-Subscription-Key": subscriptionKey },
  });

  if (!response.ok) {
    const errorDetails = await response.json();
    throw new Error(
      `Failed to poll transcription task: ${errorDetails.message}`,
    );
  }

  return response.json();
}

async function updateTaskStatus(
  uniqueName: string,
  data: PollStatusResponse,
  message: string,
) {
  await updateStatus(
    uniqueName,
    message,
    data.status,
    undefined,
    undefined,
    data.links.files || undefined,
    data.properties.destinationContainerUrl,
    JSON.stringify(data),
  );
}

// Step 3-B: Process Transcription Results
export async function processTranscriptionResult(
  uniqueName: string,
  enableDiarization: boolean = false,
  files: string,
  subscriptionKey: string,
): Promise<{ jsonData: TranscriptionResponse; transcriptionText: string }> {
  try {
    // Step 3: Get transcription content URLs
    const { transcriptionUrl, reportUrl } = await getTranscriptionContentUrl(
      files,
      subscriptionKey,
    );
    updateStatus(
      uniqueName,
      "Fetch trancrption report and file completed. Next, Get actual file data",
      undefined,
      undefined,
      undefined,
      `{transcriptionUrl: ${transcriptionUrl}, reportUrl: ${reportUrl}}`,
    );

    const trancriptionSASUrl = await generatePostFileSASToken(
      transcriptionUrl,
      30,
    );

    // Step 4: Fetch transcription data
    const transcriptionData = await fetchTranscription(
      trancriptionSASUrl,
      enableDiarization,
      subscriptionKey,
    );
    updateStatus(uniqueName, "Fetch file data completed");
    return transcriptionData;
  } catch (error) {
    updateStatus(
      uniqueName,
      "Batch task failed",
      "Failed",
      undefined,
      undefined,
      undefined,
      undefined,
      `${error}`,
    );
    console.error("Error processing transcription:", error);
    throw error;
  }
}

// Step 4: Fetch Transcription Results
export async function getTranscriptionContentUrl(
  filesUrl: string,
  subscriptionKey: string,
): Promise<{ transcriptionUrl: string; reportUrl: string }> {
  const response = await fetch(filesUrl, {
    method: "GET",
    headers: {
      "Ocp-Apim-Subscription-Key": subscriptionKey,
    },
  });

  if (!response.ok) {
    const errorDetails = await response.json();
    throw new Error(
      `Failed to fetch transcription files: ${errorDetails.message}`,
    );
  }

  const data: GetTranscriptionResultResponse = await response.json();
  const transcriptionFile = data.values.find(
    (obj) => obj.kind === "Transcription",
  );
  const reportFile = data.values.find(
    (obj) => obj.kind === "TranscriptionReport",
  );

  if (!transcriptionFile || !reportFile) {
    throw new Error("Required transcription or report file not found.");
  }

  return {
    transcriptionUrl: transcriptionFile.links.contentUrl,
    reportUrl: reportFile.links.contentUrl,
  };
}

async function generatePostFileSASToken(
  blobUrl: string,
  validityMinutes: number,
): Promise<string> {
  try {
    const storageURLString = process.env.AZURE_BLOB_LARGE_STORAGE_NAME || "";

    // Initialize the BlobServiceClient
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(storageURLString);

    // Parse the blob URL to get container and blob name
    const urlParts = new URL(blobUrl);
    const containerName = urlParts.pathname.split("/")[1];
    const blobName = urlParts.pathname.substring(containerName.length + 2);

    // Get a reference to the container and blob
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);

    // Check if the blob exists
    const blobExists = await blobClient.exists();
    if (!blobExists) {
      throw new Error("The specified blob does not exist.");
    }

    // Generate SAS token for the blob
    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse("r"), // Read permission
        expiresOn: new Date(new Date().valueOf() + validityMinutes * 60 * 1000), // Valid for specified minutes
        protocol: SASProtocol.HttpsAndHttp,
      },
      blobServiceClient.credential as StorageSharedKeyCredential,
    ).toString();

    // Return the URL with SAS token
    const blobUrlWithSAS = `${blobClient.url}?${sasToken}`;
    return blobUrlWithSAS;
  } catch (error) {
    console.error("Error generating SAS token for blob:", error);
    throw error; // Ensure error is propagated
  }
}

// Step 5: Fetch Transcription Results
export async function fetchTranscription(
  filesUrl: string,
  enableDiarization: boolean = false,
  subscriptionKey: string,
): Promise<{ jsonData: TranscriptionResponse; transcriptionText: string }> {
  const response = await fetch(filesUrl, {
    method: "GET",
    headers: {
      "Ocp-Apim-Subscription-Key": subscriptionKey,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch transcription files.");
  }

  const data: TranscriptionResponse = await response.json();
  const combinedPhrases = data.combinedRecognizedPhrases;

  if (!combinedPhrases || combinedPhrases.length === 0) {
    throw new Error("No transcription result found.");
  }

  const transcriptionText = enableDiarization
    ? formatTranscription(data)
    : combinedPhrases
        .map((phrase) => phrase.display) // Extract 'display' from each phrase
        .join(" ");

  return { jsonData: data, transcriptionText };
}

function formatTranscription(response: TranscriptionResponse): string {
  let result = "";
  const speakerMap: Map<number, string> = new Map(); // Map to assign speaker labels
  let currentSpeakerId: number | undefined = undefined;
  let currentSpeakerText: string = "";
  let currentSpeakerStartTime: string | undefined = undefined;

  const formatTimestamp = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  // Loop through the recognized phrases and format them
  response.recognizedPhrases.forEach((phrase: RecognizedPhrase) => {
    const speakerId = phrase.speaker;
    const offsetMilliseconds = phrase.offsetMilliseconds;

    const bestMatch = phrase.nBest.reduce((best, current) => {
      return current.confidence > best.confidence ? current : best;
    });
    const displayText = bestMatch.display;

    let timestamp = undefined;
    if (offsetMilliseconds) {
      timestamp = formatTimestamp(offsetMilliseconds);
    }

    if (speakerId && speakerId !== currentSpeakerId) {
      if (currentSpeakerId) {
        result += `[Speaker ${currentSpeakerId} ${currentSpeakerStartTime}]\n${currentSpeakerText}\n\n`;
      }
      currentSpeakerId = speakerId;
      currentSpeakerText = displayText;
      currentSpeakerStartTime = timestamp;

      if (!speakerMap.has(speakerId)) {
        speakerMap.set(speakerId, `Speaker ${speakerId}`);
      }
    } else {
      currentSpeakerText += ` ${displayText}`;
    }
  });
  if (currentSpeakerId) {
    result += `[Speaker ${currentSpeakerId} ${currentSpeakerStartTime}]\n${currentSpeakerText}\n\n`;
  }

  return result;
}

async function updateStatus(
  uniqueName: string,
  name: string,
  status?: string,
  diarizationEnabled?: boolean,
  maxSpeakers?: number,
  taskUrl?: string,
  destUrl?: string,
  error?: string,
) {
  try {
    const batchStatus = status
      ? BatchStatus[status as keyof typeof BatchStatus]
      : undefined;

    const updates: Partial<BatchTask> = {
      name,
      ...(batchStatus && { status: batchStatus }),
      ...(diarizationEnabled !== undefined && { diarizationEnabled }),
      ...(maxSpeakers !== undefined && { maxSpeakers }),
      ...(taskUrl && { taskUrl }),
      ...(destUrl && { destUrl }),
      ...(error && { error }),
    };

    console.log(`Status log: ${uniqueName} : ${status} : ${batchStatus}`);

    await updateTask(uniqueName, { status: "processing" }, updates);
  } catch (err) {
    console.error(`Error updating status for ${uniqueName}:`, err);
    throw err; // Optionally rethrow the error
  }
}
