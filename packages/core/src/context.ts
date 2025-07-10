import { Message } from '@grok-cli/shared';

export interface ContextEntry {
  type: 'file' | 'message' | 'system';
  content: string;
  metadata?: {
    filePath?: string;
    timestamp?: Date;
    tokens?: number;
  };
}

export class ContextManager {
  private context: ContextEntry[] = [];
  private maxTokens: number;
  private currentTokens: number = 0;

  constructor(maxTokens: number = 30000) {
    this.maxTokens = maxTokens;
  }

  addEntry(entry: ContextEntry): void {
    const tokens = this.estimateTokens(entry.content);
    entry.metadata = { ...entry.metadata, tokens, timestamp: new Date() };
    
    this.context.push(entry);
    this.currentTokens += tokens;
    
    this.pruneIfNeeded();
  }

  addFile(filePath: string, content: string): void {
    this.addEntry({
      type: 'file',
      content,
      metadata: { filePath }
    });
  }

  addMessage(message: Message): void {
    this.addEntry({
      type: 'message',
      content: message.content,
      metadata: {}
    });
  }

  addSystemMessage(content: string): void {
    this.addEntry({
      type: 'system',
      content,
      metadata: {}
    });
  }

  getMessages(): Message[] {
    const messages: Message[] = [];
    
    // Add system messages first
    const systemEntries = this.context.filter(entry => entry.type === 'system');
    for (const entry of systemEntries) {
      messages.push({ role: 'system', content: entry.content });
    }

    // Add file context
    const fileEntries = this.context.filter(entry => entry.type === 'file');
    if (fileEntries.length > 0) {
      const fileContext = fileEntries
        .map(entry => `File: ${entry.metadata?.filePath}\n\`\`\`\n${entry.content}\n\`\`\``)
        .join('\n\n');
      
      messages.push({
        role: 'system',
        content: `Here are the relevant files for context:\n\n${fileContext}`
      });
    }

    // Add conversation messages
    const messageEntries = this.context.filter(entry => entry.type === 'message');
    for (const entry of messageEntries) {
      messages.push({ role: 'user', content: entry.content });
    }

    return messages;
  }

  clear(): void {
    this.context = [];
    this.currentTokens = 0;
  }

  getTokenCount(): number {
    return this.currentTokens;
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  private pruneIfNeeded(): void {
    while (this.currentTokens > this.maxTokens && this.context.length > 1) {
      const removed = this.context.shift();
      if (removed?.metadata?.tokens) {
        this.currentTokens -= removed.metadata.tokens;
      }
    }
  }

  getSummary(): string {
    const fileCount = this.context.filter(entry => entry.type === 'file').length;
    const messageCount = this.context.filter(entry => entry.type === 'message').length;
    
    return `Context: ${fileCount} files, ${messageCount} messages, ${this.currentTokens} tokens`;
  }
}
