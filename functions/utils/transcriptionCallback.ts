import { EventEmitter } from "events";
import type { ApiKeyProvider, AudioCategory } from "$types/TenantFeature";

export interface TranscriptionMetadata {
  duration: number;
  tenantId: string;
  deploymentModel: string;
  category: AudioCategory;
  provider: ApiKeyProvider;
}

interface TranscriptionEvents {
  transcriptionCompleted: (response: TranscriptionMetadata) => void;
  transcriptionFailed: (error: Error) => void;
}

class TranscriptionCallbackHandler extends EventEmitter {
  on<K extends keyof TranscriptionEvents>(
    event: K,
    listener: TranscriptionEvents[K],
  ): this {
    return super.on(event, listener);
  }

  emit<K extends keyof TranscriptionEvents>(
    event: K,
    ...args: Parameters<TranscriptionEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }
}

export const transcriptionCallbackHandler = new TranscriptionCallbackHandler();
