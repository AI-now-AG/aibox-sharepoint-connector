// https://docs.perplexity.ai/api-reference/chat-completions
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import OpenAI from "openai";

export const enum PerplexityRole {
  SYSTEM = "system",
  ASSISTANT = "assistant",
  USER = "user",
}

export const enum PerplexityModel {
  SONAR = "sonar",
  SONAR_PRO = "sonar-pro",
  SONAR_REASONING = "sonar-reasoning",
  SONAR_REASONING_PRO = "sonar-reasoning-pro",
  R1 = "r1-1776	",
}

export interface PerplexityMessage extends BaseMessage {
  role?: string;
}

export interface PerplexityOptions {
  api_key?: string;
  model?: PerplexityModel | string;
  messages?: Array<PerplexityMessage>;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  search_domain_filter?: any;
  return_images?: boolean;
  return_related_questions?: boolean;
  search_recency_filter?: string;
  top_k?: number;
  stream?: boolean;
  presence_penalty?: number;
  frequency_penalty?: number;
  response_format?: any;
}

class Perplexity {
  apiKey: string;
  baseUrl: string = "https://api.perplexity.ai";
  perplexity: OpenAI;
  response: any;
  opions: PerplexityOptions = {
    model: PerplexityModel.SONAR,
    stream: false,
  };

  constructor(options: PerplexityOptions) {
    this.apiKey = options.api_key ?? "";
    this.perplexity = new OpenAI({
      apiKey: this.apiKey,
      baseURL: this.baseUrl,
    });
    this.opions = { ...this.opions, ...options };
    return this;
  }

  extractMessage(message: PerplexityMessage) {
    if (
      message instanceof SystemMessage ||
      message.role === PerplexityRole.SYSTEM
    ) {
      return {
        role: PerplexityRole.SYSTEM,
        content: message.content,
      };
    }
    if (
      message instanceof AIMessage ||
      message.role === PerplexityRole.ASSISTANT
    ) {
      return {
        role: PerplexityRole.ASSISTANT,
        content: message.content,
      };
    }

    if (
      message instanceof HumanMessage ||
      message.role === PerplexityRole.USER
    ) {
      return {
        role: PerplexityRole.USER,
        content: message.content,
      };
    }
    return {
      role: PerplexityRole.USER,
      content: message.content,
    };
  }

  extractMessages(messages: Array<PerplexityMessage>) {
    const resultMessages: Array<any> = [];
    for (let i = 0; i < messages.length; i++) {
      const message = this.extractMessage(messages[i]);
      resultMessages.push(message);
    }
    return resultMessages;
  }

  async invoke(
    messages: Array<PerplexityMessage>,
    options?: PerplexityOptions,
  ) {
    const extractedMessages = this.extractMessages(messages);
    const data: any = {
      ...this.opions,
      ...(options ?? {}),
      messages: extractedMessages,
    };
    try {
      this.response = await this.perplexity.chat.completions.create(data);
    } catch (error) {
      console.error("Error calling Perplexity API:", error);
      throw error;
    } finally {
      return this.response;
    }
  }

  pipe(paser: any) {
    return this;
  }

  async stream(
    messages: Array<PerplexityMessage>,
    options?: PerplexityOptions,
  ) {
    const extractedMessages = this.extractMessages(messages);
    const data: any = {
      ...this.opions,
      ...(options ?? {}),
      stream: true,
      messages: extractedMessages,
    };

    try {
      this.response = await this.perplexity.chat.completions.create(data);
    } catch (error) {
      console.error("Error stream Perplexity API:", error);
      throw error;
    } finally {
      return this.response;
    }
  }
}

export default Perplexity;
