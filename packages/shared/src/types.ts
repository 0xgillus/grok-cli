export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface GrokModel {
  id: string;
  name: string;
  description?: string;
  contextLength: number;
}

export interface GrokResponse {
  id: string;
  choices: Array<{
    message: Message;
    finishReason: string;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface Config {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface CLIError extends Error {
  code?: string;
  statusCode?: number;
}
