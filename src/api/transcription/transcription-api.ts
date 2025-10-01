import { AudioCategory } from "$types/TenantFeature";
import { type TranscribeRequest, FileFormat } from "$types/TranscribeRequest";

export interface TranscriptionConfig {
  apiUrl: string;
  apiKey: string;
}

export interface SASTokenResponse {
  uploadUrl: string;
  outputFileName: string;
}

export interface TranscriptionProgressEvent {
  type: 'connection' | 'started' | 'progress' | 'complete' | 'error';
  jobId?: string;
  fileName?: string;
  progress?: number;
  status?: string;
  result?: TranscriptionResult;
  error?: string;
}

export interface TranscriptionResult {
  text?: string;
  urls?: {
    txt?: string;
    srt?: string;
    ass?: string;
    json?: string;
  };
  duration?: number;
  language?: string;
}

/**
 * Get transcription configuration from backend
 */
export async function getTranscriptionConfig(): Promise<TranscriptionConfig> {
  const configResponse = await fetch(
    "/.netlify/functions/getTranscriptionConfig",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!configResponse.ok) {
    throw new Error("Failed to get transcription configuration");
  }

  const { apiKey, apiUrl } = await configResponse.json();
  return {
    apiKey,
    apiUrl: apiUrl || process.env.AZURE_BACKEND_URL || 'http://localhost:3000',
  };
}

/**
 * Get SAS token for file upload
 */
export async function getSASToken(
  fileNameWithoutExtension: string,
  fileExtension: string,
  folderName: string,
  category: AudioCategory,
  accessToken: string
): Promise<SASTokenResponse> {
  const config = await getTranscriptionConfig();

  const response = await fetch(`${config.apiUrl}/api/transcription/sas-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      fileNameWithoutExtension,
      fileExtension,
      folderName,
      category,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get SAS token: ${response.statusText}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || "Failed to get SAS token");
  }

  return result.data;
}

/**
 * Start transcription with SSE streaming
 */
export async function startTranscription(
  params: TranscribeRequest,
  accessToken: string,
  onProgress: (event: TranscriptionProgressEvent) => void
): Promise<TranscriptionResult> {
  const config = await getTranscriptionConfig();

  return new Promise((resolve, reject) => {
    let finalResult: TranscriptionResult | null = null;

    fetch(`${config.apiUrl}/api/transcription/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "text/event-stream",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify(params),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error("No response body for streaming");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        function readStream(): void {
          reader.read().then(({ done, value }) => {
            if (done) {
              // Stream ended, resolve with final result
              if (finalResult) {
                resolve(finalResult);
              } else {
                reject(new Error("Stream ended without final result"));
              }
              return;
            }

            // Decode the chunk and add to buffer
            buffer += decoder.decode(value, { stream: true });

            // Process complete lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const eventData = JSON.parse(line.slice(6));

                  // Call progress callback
                  onProgress(eventData);

                  switch (eventData.type) {
                    case 'complete':
                      finalResult = eventData.result;
                      break;
                    case 'error':
                      reject(new Error(eventData.error || 'Transcription failed'));
                      return;
                  }
                } catch (parseError) {
                  console.warn('Failed to parse SSE event:', line, parseError);
                }
              }
            }

            readStream(); // Continue reading
          }).catch(error => {
            reject(error);
          });
        }

        readStream(); // Start reading the stream
      })
      .catch(error => {
        console.error('Transcription error:', error);
        reject(error);
      });
  });
}

/**
 * Check transcription status
 */
export async function checkTranscriptionStatus(
  jobId: string,
  tenantId: string,
  userId: string,
  uniqueName: string,
  fileNames: string[],
  folderName: string,
  showTextPreviewChecked: boolean,
  category: AudioCategory,
  accessToken: string
): Promise<any> {
  const config = await getTranscriptionConfig();

  const response = await fetch(`${config.apiUrl}/api/transcription/status/${jobId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      tenantId,
      userId,
      uniqueName,
      fileNames,
      folderName,
      showTextPreviewChecked,
      typedCategory: category,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to check status: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Download transcription files
 */
export async function downloadTranscriptionFiles(
  jobId: string,
  format: FileFormat,
  accessToken: string
): Promise<any> {
  const config = await getTranscriptionConfig();

  const response = await fetch(
    `${config.apiUrl}/api/transcription/download/${jobId}?format=${format}`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to download files: ${response.statusText}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || "Failed to download files");
  }

  return result.data;
}

/**
 * Start batch transcription (AudioPro/SubtitleLarge)
 */
export async function startBatchTranscription(
  params: TranscribeRequest,
  accessToken: string
): Promise<{ jobId: string; status: string; pollUrl: string }> {
  const config = await getTranscriptionConfig();

  const response = await fetch(`${config.apiUrl}/api/transcription/batch/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Failed to start batch transcription: ${response.statusText}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || "Failed to start batch transcription");
  }

  return result.data;
}

/**
 * Check batch transcription status
 */
export async function checkBatchTranscriptionStatus(
  jobId: string,
  accessToken: string
): Promise<{
  status: string;
  progress?: string;
  text?: string;
  urls?: {
    txt?: string;
    srt?: string;
    ass?: string;
    json?: string;
  };
  jsonData?: any;
  error?: string;
}> {
  const config = await getTranscriptionConfig();

  const response = await fetch(`${config.apiUrl}/api/transcription/batch/status/${jobId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to check batch status: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}