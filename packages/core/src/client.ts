import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Message, ChatOptions, GrokResponse, GrokModel, CLIError } from '@grok-cli/shared';

export interface GrokAPIClientOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export class GrokAPIClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(options: GrokAPIClientOptions) {
    this.apiKey = options.apiKey;
    
    this.client = axios.create({
      baseURL: options.baseUrl || 'https://api.x.ai/v1',
      timeout: options.timeout || 30000,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const cliError: CLIError = new Error(
          error.response?.data?.error?.message || error.message
        );
        cliError.code = error.response?.data?.error?.code || error.code;
        cliError.statusCode = error.response?.status;
        throw cliError;
      }
    );
  }

  async chat(messages: Message[], options: ChatOptions = {}): Promise<GrokResponse> {
    if (!options.model) {
      throw new Error('Model must be specified. No default model available.');
    }
    
    try {
      const response: AxiosResponse<GrokResponse> = await this.client.post('/chat/completions', {
        model: options.model,
        messages,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        stream: false,
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async *stream(messages: Message[], options: ChatOptions = {}): AsyncGenerator<string> {
    if (!options.model) {
      throw new Error('Model must be specified. No default model available.');
    }
    
    try {
      const response = await this.client.post('/chat/completions', {
        model: options.model,
        messages,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        stream: true,
      }, {
        responseType: 'stream',
      });

      let buffer = '';
      
      for await (const chunk of response.data) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '' || line.trim() === 'data: [DONE]') {
            continue;
          }

          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async models(): Promise<GrokModel[]> {
    try {
      const response = await this.client.get('/models');
      return response.data.data.map((model: any) => ({
        id: model.id,
        name: model.id,
        description: model.description,
        contextLength: model.context_length || 32768,
      }));
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): CLIError {
    if (error.code === 'ENOTFOUND') {
      const cliError: CLIError = new Error('Network error: Unable to connect to xAI API');
      cliError.code = 'NETWORK_ERROR';
      return cliError;
    }

    if (error.statusCode === 401) {
      const cliError: CLIError = new Error('Authentication failed: Invalid API key');
      cliError.code = 'AUTH_ERROR';
      cliError.statusCode = 401;
      return cliError;
    }

    if (error.statusCode === 429) {
      const cliError: CLIError = new Error('Rate limit exceeded: Please try again later');
      cliError.code = 'RATE_LIMIT';
      cliError.statusCode = 429;
      return cliError;
    }

    return error;
  }
}
