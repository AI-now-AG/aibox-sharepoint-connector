export enum MessageRole {
  System = "system",
  Assistant = "assistant",
  User = "user",
}

export interface Message {
  role: MessageRole;
  content: string;
  rawData?: any;
}

export type MessageHistory = Message[];

export default { MessageRole };
