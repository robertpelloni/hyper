// Re-implementation of Goose's Abstract LLM Provider Interface

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ProviderResponse {
  text: string;
  usage?: { promptTokens: number; completionTokens: number };
}

export interface LLMProvider {
  name: string;
  chat(messages: Message[]): Promise<ProviderResponse>;
  streamChat(messages: Message[], onChunk: (chunk: string) => void): Promise<ProviderResponse>;
}
