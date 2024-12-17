// Create a Batch Transcription Task

import type { PollStatusResponse } from "$utils/Speech/PollStatusResponse";
import type { TranscriptionRequestBody } from "$utils/Speech/SpeechRequest";
import type { TranscriptionResponse } from "$utils/Speech/SpeechResponse";
import type { GetTranscriptionResultResponse } from "$utils/Speech/SpeechResultResponse";
import { updateTask } from "$shared/transcriptionTasks";

const subscriptionKey = process.env.AZURE_LARGE_SPEECH_KEY || "";

// Step 1: Process Transcription Workflow
export async function processTranscription(
  blobUrl: string,
  uniqueName: string,
  enableDiarization: boolean = false,
  numberOfMaxSpeakers: number = 2,
): Promise<{ jsonData: TranscriptionResponse; transcriptionText: string }> {
  try {
    console.log("unique name:")
    console.log(uniqueName)
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
    const pollResponse = await pollTranscriptionTask(taskResponse.self);
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
    const transcriptionData = await fetchTranscription(transcriptionUrl);
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
): Promise<PollStatusResponse> {
  const url = `https://${process.env.AZURE_LARGE_SPEECH_REGION}.api.cognitive.microsoft.com/speechtotext/v3.2/transcriptions`;
  const destinationContainerUrl = `${process.env.AZURE_LARGE_DESTINATION_URL}${process.env.AZURE_LARGE_CONTAINER_NAME}`;
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
    console.log(errorDetails);
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
): Promise<PollStatusResponse> {
  while (true) {
    console.log(transcriptionIdUrl);
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
      throw new Error("Poll batch transcription task failed.");
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
  console.log(data);
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

  const transcriptionText = combinedPhrases
    .map((phrase) => phrase.display) // Extract 'display' from each phrase
    .join(" "); // Combine all phrases into a single string

  return { jsonData: data, transcriptionText };
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
//   updateTask(
//     uniqueName,
//     { status: "processing" },
//     {
//       name: name,
//       status: status,
//       taskUrl: taskUrl,
//       diarizationEnabled: diarizationEnabled,
//       maxSpeakers: maxSpeakers,
//       error: error,
//     },
//   );
}
