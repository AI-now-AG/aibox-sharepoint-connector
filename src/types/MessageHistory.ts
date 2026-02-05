export enum MessageRole {
  Assistant = "assistant",
  User = "user",
}

export type SourceType = 'vector' | 'text' | 'hybrid';

export interface SourceAttribution {
  fileName: string;
  score: number;
  pageNumber?: number;
  snippet: string;
  chunkIndex?: number;
  content?: string;
  vectorScore?: number;
  textScore?: number;
  fusedScore?: number;
  rerankScore?: number;
  sourceType?: SourceType;
}

export interface FilteredChunkInfo {
  fileName: string;
  score: number;
  reason: 'rerank_cutoff' | 'below_threshold';
  snippet?: string;
  content?: string;
  pageNumber?: number;
}

export interface RAGDebugInfo {
  searchMode: 'vector' | 'hybrid';
  similarityThreshold: number;
  vectorResultCount: number;
  vectorTopScore?: number;
  textResultCount?: number;
  textTopScore?: number;
  hybridAlpha?: number;
  totalUniqueChunks?: number;
  wasReranked: boolean;
  rerankLatencyMs?: number;
  rerankInputCount?: number;
  rerankOutputCount?: number;
  filteredChunks?: FilteredChunkInfo[];
  wasAnswerabilityChecked: boolean;
  answerabilityThreshold?: number;
  answerabilityConfidence?: number;
  answerabilityDecision?: 'answer' | 'clarify' | 'decline';
  wasCompressed: boolean;
  originalContextLength?: number;
  compressedContextLength?: number;
  compressionRatio?: number;
  wasMultiHop: boolean;
  hopCount?: number;
  multiHopQueries?: string[];
  wasMultiQuery?: boolean;
  multiQueryVariations?: string[];
}

export interface Message {
  role: MessageRole;
  content: string;
  rawData?: string;
  imageUrl?: string;
  fileUrls?: string[];
  thumbRating?: MessageThumbRating | null;
  imageThoughtSignature?: string;
  imageMimeType?: string;
  sources?: SourceAttribution[];
  ragDebug?: RAGDebugInfo | null;
}

export enum MessageThumbRating {
  Up = "up",
  Down = "down",
  Cancel = "cancel"
}

export type MessageHistory = Message[];

export default { MessageRole };
