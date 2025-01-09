export interface FileResult {
  self: string;
  name: string;
  kind: string;
  properties: {
    size: number;
  };
  createdDateTime: string;
  links: {
    contentUrl: string;
  };
}

export interface GetTranscriptionResultResponse {
  values: FileResult[];
}
