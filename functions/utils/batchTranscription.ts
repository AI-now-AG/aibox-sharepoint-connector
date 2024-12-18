// Create a Batch Transcription Task

import type { PollStatusResponse } from "$utils/Speech/PollStatusResponse";
import type { TranscriptionRequestBody } from "$utils/Speech/SpeechRequest";
import type {
  RecognizedPhrase,
  TranscriptionResponse,
} from "$utils/Speech/SpeechResponse";
import type { GetTranscriptionResultResponse } from "$utils/Speech/SpeechResultResponse";
import { type BatchTask, updateTask } from "$shared/transcriptionTasks";

const subscriptionKey = process.env.AZURE_LARGE_SPEECH_KEY || "";

// Step 1: Process Transcription Workflow
export async function processTranscription(
  blobUrl: string,
  uniqueName: string,
  enableDiarization: boolean = false,
  numberOfMaxSpeakers: number = 2,
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
    );
    updateStatus(
      uniqueName,
      "Batch task created",
      taskResponse.status,
      undefined,
      undefined,
      taskResponse.self,
    );

    // Step 2: Poll transcription task status
    updateStatus(uniqueName, "Polling initiated");
    const pollResponse = await pollTranscriptionTask(
      taskResponse.self,
      uniqueName,
    );
    updateStatus(
      uniqueName,
      "Polling completed",
      pollResponse.status,
      undefined,
      undefined,
      pollResponse.links.files,
    );

    // Step 3: Get transcription content URLs
    updateStatus(uniqueName, "Get file status");
    const { transcriptionUrl, reportUrl } = await getTranscriptionContentUrl(
      pollResponse.links.files,
    );
    updateStatus(
      uniqueName,
      "Fetch file status completed",
      undefined,
      undefined,
      undefined,
      `{transcriptionUrl: ${transcriptionUrl}, reportUrl: ${reportUrl}}`,
    );

    // Step 4: Fetch transcription data
    updateStatus(uniqueName, "Get file data");
    const transcriptionData = await fetchTranscription(
      transcriptionUrl,
      enableDiarization,
    );
    updateStatus(uniqueName, "Fetch file data completed");

    return transcriptionData;
  } catch (error) {
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
): Promise<PollStatusResponse> {
  const url = `https://${process.env.AZURE_LARGE_SPEECH_REGION}.api.cognitive.microsoft.com/speechtotext/v3.2/transcriptions`;
  const destinationContainerUrl = `${process.env.AZURE_LARGE_DESTINATION_URL}${process.env.AZURE_LARGE_CONTAINER_NAME}`;
  //const destinationContainerUrl = "https://aiboxstore.blob.core.windows.net/transcription-container?sp=racwdli&st=2024-12-18T11:58:18Z&se=2024-12-18T19:58:18Z&sv=2022-11-02&sr=c&sig=94abClhrwhVX32lHdiS2%2B63mtoDHO5meHbNIVHFN8WQ%3D";
  const body: TranscriptionRequestBody = {
    displayName: "My Transcription",
    locale: "de-ch",
    contentUrls: [blobUrl],
    destinationContainerUrl: destinationContainerUrl,
    properties: {
      wordLevelTimestampsEnabled: false,
      displayFormWordLevelTimestampsEnabled: true,
      diarizationEnabled: enableDiarization,
      languageIdentification: {
        candidateLocales: ["fr-ch", "it-ch", "en-us", "en-gb", "de-ch"],
      },
      punctuationMode: "DictatedAndAutomatic",
      profanityFilterMode: "None",
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
      `${errorDetails}`,
    );
    throw new Error(
      `Failed to create batch transcription: ${errorDetails.message}`,
    );
  }

  const data: PollStatusResponse = await response.json();
  return data;
}

// Step 3: Poll for Transcription Task Completion
export async function pollTranscriptionTask(
  transcriptionIdUrl: string,
  uniqueName: string,
): Promise<PollStatusResponse> {
  let isRunning = false;
  while (true) {
    const response = await fetch(transcriptionIdUrl, {
      method: "GET",
      headers: { "Ocp-Apim-Subscription-Key": subscriptionKey },
    });

    if (!response.ok) {
      const errorDetails = await response.json();
      throw new Error(
        `Failed to poll transcription task: ${errorDetails.message}`,
      );
    }

    const data: PollStatusResponse = await response.json();
    if (data.status === "Succeeded") {
      return data;
    } else if (data.status === "Failed") {
      updateStatus(
        uniqueName,
        `Poll Batch task ${data.status}`,
        data.status,
        undefined,
        undefined,
        undefined,
        `${JSON.stringify(data)}`,
      );
      throw new Error(
        `Poll transcription task failed: ${data.properties.error?.message}`,
      );
    } else if (data.status === "Running" && !isRunning) {
      isRunning = true;
      updateStatus(
        uniqueName,
        `Poll Batch task ${data.status}`,
        data.status,
        undefined,
        undefined,
        undefined,
        `${JSON.stringify(data)}`,
      );
    }

    // Wait 5 seconds before polling again
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

// Step 4: Fetch Transcription Results
export async function getTranscriptionContentUrl(
  filesUrl: string,
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

// Step 5: Fetch Transcription Results
export async function fetchTranscription(
  filesUrl: string,
  enableDiarization: boolean = false,
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
  response.recognizedPhrases.forEach(
    (phrase: RecognizedPhrase) => {
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
    },
  );
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
  error?: string,
) {
  const updates: Partial<BatchTask> = {
    name,
    ...(status !== undefined && { status }),
    ...(diarizationEnabled !== undefined && { diarizationEnabled }),
    ...(maxSpeakers !== undefined && { maxSpeakers }),
    ...(taskUrl !== undefined && { taskUrl }),
    ...(error !== undefined && { error }),
  };
  await updateTask(uniqueName, { status: "processing" }, updates);
}
