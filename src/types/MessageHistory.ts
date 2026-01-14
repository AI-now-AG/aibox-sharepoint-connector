export enum MessageRole {
  Assistant = "assistant",
  User = "user",
}

// Source attribution for Vector KB RAG responses
export interface SourceAttribution {
  fileName: string;
  score: number;
  pageNumber?: number;
  snippet: string;
  chunkIndex?: number;
}

export interface Message {
  role: MessageRole;
  content: string;
  rawData?: string;
  imageUrl?: string;
  fileUrls?: string[];
  thumbRating?: MessageThumbRating | null;
  imageThoughtSignature?: string; // new
  imageMimeType?: string;         // optional helper
  sources?: SourceAttribution[];  // Vector KB sources for RAG responses
}

export enum MessageThumbRating {
  Up = "up",
  Down = "down",
  Cancel = "cancel"
}

export type MessageHistory = Message[];

export default { MessageRole };
