export enum MessageRole {
  Assistant = "assistant",
  User = "user",
}

// Source type indicating how the source was retrieved
export type SourceType = 'vector' | 'text' | 'hybrid';

// Source attribution for Vector KB RAG responses
export interface SourceAttribution {
  fileName: string;
  score: number;
  pageNumber?: number;
  snippet: string;
  chunkIndex?: number;
  content?: string; // Full chunk content for expandable view
  // Debug fields for per-source visibility
  vectorScore?: number;    // Original cosine similarity (0-1)
  textScore?: number;      // Raw BM25 score (unbounded)
  fusedScore?: number;     // RRF combined score (tiny, e.g., 0.016)
  rerankScore?: number;    // Score after reranking
  sourceType?: SourceType; // How this source was found
}

// Filtered chunk info - chunks discarded during reranking
export interface FilteredChunkInfo {
  fileName: string;
  score: number;
  reason: 'rerank_cutoff' | 'below_threshold';
  snippet?: string;  // Short preview of the content
  content?: string;  // Full chunk content for expandable view
  pageNumber?: number;
}

// RAG pipeline debug information for frontend visualization
export interface RAGDebugInfo {
  // Search info
  searchMode: 'vector' | 'hybrid';
  similarityThreshold: number;

  // Vector search details
  vectorResultCount: number;
  vectorTopScore?: number;

  // Text search details (when hybrid)
  textResultCount?: number;
  textTopScore?: number;

  // Fusion details (when hybrid)
  hybridAlpha?: number;
  totalUniqueChunks?: number;

  // Reranking
  wasReranked: boolean;
  rerankLatencyMs?: number;
  rerankInputCount?: number;
  rerankOutputCount?: number;

  // Filtered chunks (discarded during reranking)
  filteredChunks?: FilteredChunkInfo[];

  // Answerability
  wasAnswerabilityChecked: boolean;
  answerabilityThreshold?: number;
  answerabilityConfidence?: number;
  answerabilityDecision?: 'answer' | 'clarify' | 'decline';

  // Compression
  wasCompressed: boolean;
  originalContextLength?: number;
  compressedContextLength?: number;
  compressionRatio?: number;

  // Multi-hop
  wasMultiHop: boolean;
  hopCount?: number;
  multiHopQueries?: string[];
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
  ragDebug?: RAGDebugInfo | null; // RAG pipeline debug information
}

export enum MessageThumbRating {
  Up = "up",
  Down = "down",
  Cancel = "cancel"
}

export type MessageHistory = Message[];

export default { MessageRole };
