export interface UpdateStatusParams {
  uniqueName: string;
  name: string;
  status?: string;
  diarizationEnabled?: boolean;
  maxSpeakers?: number;
  taskUrl?: string;
  destUrl?: string;
  error?: string;
  report?: Record<string, unknown>;
}
