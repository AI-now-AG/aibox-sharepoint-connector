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

/**
 * Convert stereo audio to mono using the remote API
 * @param config Configuration object for the conversion
 */
export async function convertToMono(config: ConvertToMonoConfig): Promise<ConvertToMonoResponse> {
  const {
    baseUrl,
    apiKey,
    blobName,
    category,
    outputFormat = 'mp3',
    deleteOriginal = false,
    folderName,
    uniqueName,
    timeoutMs = 300000
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

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const result: ConvertToMonoResponse = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || `HTTP ${response.status}: ${response.statusText}`,
        error: result.error || `Request failed with status ${response.status}`
      };
    }

    return result;

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        message: `Request timed out after ${timeoutMs / 1000} seconds`,
        error: 'Request timeout'
      };
    }

    return {
      success: false,
      message: 'Network error occurred while calling the API',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export default convertToMono;