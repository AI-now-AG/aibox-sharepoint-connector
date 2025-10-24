export interface ProcessedFile {
  file: File;
  reasons?: string[]; // undefined ⇒ accepted, array ⇒ rejected
}

export interface FilesDroppedDetail {
  files: ProcessedFile[];
}

// Payload when some files are rejected
export interface FilesRejectedDetail {
  files: ProcessedFile[];
}

export type FilesDroppedEvent = CustomEvent<FilesDroppedDetail>;
export type FilesRejectedEvent = CustomEvent<FilesRejectedDetail>;

export type DndOptions = {
  enabled?: boolean;
  acceptedTypes?: Record<string, string[]>; // Allowed MIME types
  maxSize?: number; // Max file size in bytes
  onDragStart?: () => void;
  onDragEnd?: () => void;
};
