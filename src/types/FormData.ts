export interface UploadedFile {
  fieldname: string;
  filename: string;
  encoding: string;
  mimeType: string;
  buffer: Buffer;
}

export interface ParsedForm {
  fields: Record<string, string>;
  files: UploadedFile[];
}
