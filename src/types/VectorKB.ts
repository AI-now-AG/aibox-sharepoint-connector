import { EmbeddingProvider, VectorKBScope } from "./AIProvider";

// Re-export for convenience
export { EmbeddingProvider, VectorKBScope };

// Data source processing status
export enum DataSourceStatus {
  Pending = "pending",
  Processing = "processing",
  Completed = "completed",
  Failed = "failed",
}

// Supported file types for Vector KB
export enum VectorFileType {
  PDF = "pdf",
  TXT = "txt",
  DOCX = "docx",
}

// Vector folder structure
export interface VectorFolder {
  _id: string;
  tenant_id: string;
  name: string;
  parent_folder_id: string | null;
  description?: string;
  data_source_count?: number;
  created_by: string;
  created_at: string;
}

// Vector folder with counts (for list views)
export interface VectorFolderWithCounts extends VectorFolder {
  data_source_count: number;
  child_count?: number;
}

// Folder tree node for hierarchical view
export interface FolderTreeNode extends VectorFolder {
  children: FolderTreeNode[];
  data_source_count: number;
}

// Uploaded data source (file)
export interface VectorDataSource {
  _id: string;
  tenant_id: string;
  folder_id: string | null;
  original_file_name: string;
  file_type: VectorFileType;
  file_size_bytes: number;
  blob_url: string;
  blob_name: string;
  chunk_count: number;
  status: DataSourceStatus;
  error_message?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Individual text chunk with embedding
export interface VectorChunk {
  _id: string;
  tenant_id: string;
  data_source_id: string;
  folder_id: string | null;
  chunk_index: number;
  content: string;
  token_count: number;
  metadata: {
    page_number: number | null;
    section_title: string | null;
    file_name?: string;
  };
  created_at: string;
}

// Source attribution for RAG responses
export interface SourceAttribution {
  fileName: string;
  score: number;
  pageNumber?: number;
  snippet: string;
}

// Storage usage information
export interface StorageUsage {
  usedBytes: number;
  usedMB: number;
  maxMB: number;
  usedPercentage: number;
  remainingMB: number;
}

// API Response types
export interface VectorKBApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedChunksResponse {
  chunks: VectorChunk[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Form input types for creating/updating
export interface CreateFolderInput {
  tenantId: string;
  name: string;
  parentFolderId?: string;
  description?: string;
  createdBy: string;
}

export interface UpdateFolderInput {
  name?: string;
  description?: string;
}

export interface UploadDataSourceInput {
  tenantId: string;
  folderId?: string;
  createdBy: string;
  file: File;
}

// Search options
export interface VectorSearchOptions {
  tenantId: string;
  query: string;
  topK?: number;
  similarityThreshold?: number;
  scope?: VectorKBScope;
  folderIds?: string[];
  dataSourceIds?: string[];
}

// RAG configuration display
export interface RAGConfiguration {
  enabled: boolean;
  provider?: string;
  model?: string;
  topK?: number;
  similarityThreshold?: number;
  chunkSize?: number;
  chunkOverlap?: number;
  indexedChunks?: number;
}

// Embedding model options for each provider
export const EMBEDDING_MODELS: Record<EmbeddingProvider, { value: string; label: string }[]> = {
  [EmbeddingProvider.OpenAI]: [
    { value: "text-embedding-3-small", label: "text-embedding-3-small (1536 dims, Recommended)" },
    { value: "text-embedding-3-large", label: "text-embedding-3-large (3072 dims)" },
    { value: "text-embedding-ada-002", label: "text-embedding-ada-002 (Legacy)" },
  ],
  [EmbeddingProvider.AzureOpenAI]: [
    { value: "text-embedding-ada-002", label: "text-embedding-ada-002 (1536 dims)" },
    { value: "text-embedding-3-small", label: "text-embedding-3-small (1536 dims)" },
    { value: "text-embedding-3-large", label: "text-embedding-3-large (3072 dims)" },
  ],
  [EmbeddingProvider.Gemini]: [
    { value: "text-embedding-004", label: "text-embedding-004 (768 dims)" },
  ],
};

// Default Vector KB configuration values
export const DEFAULT_VECTOR_KB_CONFIG = {
  chunkSize: 800,
  chunkOverlap: 200,
  maxStorageMB: 500,
  topK: 5,
  similarityThreshold: 0.7,
};
