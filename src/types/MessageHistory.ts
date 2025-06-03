export enum MessageRole {
  Assistant = "assistant",
  User = "user",
}

export interface Message {
  role: MessageRole;
  content: string;
  rawData?: string;
  imageUrl?: string;
}

export type MessageHistory = Message[];

export default { MessageRole };
