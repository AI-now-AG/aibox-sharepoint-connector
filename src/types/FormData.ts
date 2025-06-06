export interface UploadedFile {
  fieldname: string;
  filename: string;
  encoding: string;
  mimeType: string;
  buffer: Buffer;
}

export interface ParsedForm {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: Record<string, any>;
  files: UploadedFile[];
}
