export enum MessageRole {
  Assistant = "assistant",
  User = "user",
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
}

export enum MessageThumbRating {
  Up = "up",
  Down = "down",
  Cancel = "cancel"
}

export type MessageHistory = Message[];

export default { MessageRole };
