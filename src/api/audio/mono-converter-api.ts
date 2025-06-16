import { AudioCategory } from "$types/TenantFeature";

export interface ConvertToMonoConfig {
  baseUrl: string;
  apiKey: string;
  blobName: string;
  category: AudioCategory;
  outputFormat?: string;
  deleteOriginal?: boolean;
  folderName?: string;
  uniqueName?: string;
  timeoutMs?: number;
}

export interface ConvertToMonoResponse {
  success: boolean;
  message: string;
  data?: {
    originalBlobName: string;
    convertedBlobName: string;
    convertedBlobUrl: string;
    convertedSasUrl?: string;
    originalSizeMB: number;
    convertedSizeMB: number;
    compressionRatio: number;
    processingTimeMs: number;
  };
  error?: string;
}

export interface HealthCheckResponse {
  success: boolean;
  message: string;
  data?: {
    tempDirectory: string;
    timestamp: string;
  };
  error?: string;
}

// SSE Event types from server
export interface SSEEvent {
  type: 'connection' | 'progress' | 'complete' | 'error';
  message?: string;
  progress?: number;
  status?: string; // Additional status message for progress
  result?: ConvertToMonoResponse;
}

// Progress callback function type  
export type ProgressCallback = (progress: number, status?: string) => void;
export type CompleteCallback = (result: ConvertToMonoResponse) => void;
export type ErrorCallback = (error: ConvertToMonoResponse) => void;

export interface ConvertToMonoCallbacks {
  onProgress?: ProgressCallback;
  onComplete?: CompleteCallback;
  onError?: ErrorCallback;
}

/**
 * Convert stereo audio to mono using SSE streaming
 * @param config Configuration object for the conversion
 * @param callbacks Callback functions for progress, completion, and errors
 * @returns Promise<ConvertToMonoResponse> - Final result
 */
export async function convertToMono(
  config: ConvertToMonoConfig, 
  callbacks?: ConvertToMonoCallbacks
): Promise<ConvertToMonoResponse> {
  const {
    baseUrl,
    apiKey,
    blobName,
    category,
    outputFormat = 'mp3',
    deleteOriginal = false,
    folderName,
    uniqueName,
    timeoutMs = 1800000
  } = config;

  const apiUrl = `${baseUrl}/api/audio/convert-to-mono`;

  if (!apiUrl) throw new Error('apiUrl is required');
  if (!apiKey) throw new Error('apiKey is required');
  if (!blobName) throw new Error('blobName is required');
  if (!category) throw new Error('category is required');
  if (!Object.values(AudioCategory).includes(category)) {
    throw new Error(`Invalid category. Must be one of: ${Object.values(AudioCategory).join(', ')}`);
  }

  interface RequestBody {
    blobName: string;
    category: AudioCategory;
    outputFormat: string;
    deleteOriginal: boolean;
    folderName?: string;
    uniqueName?: string;
  }

  const requestBody: RequestBody = {
    blobName,
    category,
    outputFormat,
    deleteOriginal
  };

  if (folderName) requestBody.folderName = folderName;
  if (uniqueName) requestBody.uniqueName = uniqueName;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  return new Promise<ConvertToMonoResponse>((resolve, reject) => {
    let finalResult: ConvertToMonoResponse | null = null;
    
    console.log('Starting fetch request to:', apiUrl);

    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    })
    .then(response => {
      clearTimeout(timeoutId);
      console.log('Fetch response received:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body for streaming');
      }

      console.log('Starting to read SSE stream...');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      function readStream(): void {
        reader.read().then(({ done, value }) => {
          if (done) {
            console.log('SSE stream ended');
            // Stream ended, resolve with final result
            if (finalResult) {
              console.log('Resolving with final result:', finalResult);
              resolve(finalResult);
            } else {
              console.warn('Stream ended without final result');
              reject(new Error('Stream ended without final result'));
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
                const eventData = JSON.parse(line.slice(6)) as SSEEvent;
                
                switch (eventData.type) {
                  case 'connection':
                    console.log('SSE connection confirmed:', eventData.message);
                    break;
                    
                  case 'progress':
                    if (eventData.progress !== undefined) {
                      callbacks?.onProgress?.(eventData.progress, eventData.status);
                    }
                    break;
                    
                  case 'complete':
                    console.log('Received completion event:', eventData.result);
                    if (eventData.result) {
                      finalResult = eventData.result;
                      callbacks?.onComplete?.(eventData.result);
                      // Don't resolve here, wait for stream to end
                    }
                    break;
                    
                  case 'error':
                    console.log('Received error event:', eventData.result);
                    if (eventData.result) {
                      const errorResult = eventData.result;
                      callbacks?.onError?.(errorResult);
                      reject(new Error(errorResult.message || 'Conversion failed'));
                      return;
                    }
                    break;
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE event:', line, parseError);
              }
            } else if (line.trim()) {
              console.log('Non-SSE line received:', line);
            }
          }

          readStream(); // Continue reading
        }).catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
      }

      readStream(); // Start reading the stream
    })
    .catch(error => {
      clearTimeout(timeoutId);
      console.error('Fetch error:', error);
      
      if (error.name === 'AbortError') {
        const timeoutError: ConvertToMonoResponse = {
          success: false,
          message: 'Operation timed out',
          error: `Request exceeded timeout of ${timeoutMs/1000} seconds`
        };
        callbacks?.onError?.(timeoutError);
        reject(timeoutError);
      } else {
        console.error('Network error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        
        const networkError: ConvertToMonoResponse = {
          success: false,
          message: 'Network error occurred while calling the API',
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
        callbacks?.onError?.(networkError);
        reject(networkError);
      }
    });
  });
}

/**
 * Legacy function for backward compatibility (without streaming)
 * @deprecated Use convertToMono with callbacks for better UX
 */
export async function convertToMonoLegacy(config: ConvertToMonoConfig): Promise<ConvertToMonoResponse> {
  return convertToMono(config);
}

export default convertToMono;