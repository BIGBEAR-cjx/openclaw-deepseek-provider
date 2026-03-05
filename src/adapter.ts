/**
 * OpenClaw Provider Adapter for DeepSeek
 * 
 * This file provides the adapter interface for OpenClaw to use DeepSeek
 */

import { DeepSeekProvider, DeepSeekMessage, DeepSeekRequest } from "./index.js";

// OpenClaw provider interface
export interface OpenClawProvider {
  name: string;
  models: string[];
  defaultModel: string;
  authType: "api-key" | "oauth";
  envVar: string;
}

// DeepSeek provider configuration for OpenClaw
export const DEEPSEEK_PROVIDER_CONFIG: OpenClawProvider = {
  name: "deepseek",
  models: [
    "deepseek/deepseek-chat",
    "deepseek/deepseek-reasoner",
    "deepseek/deepseek-coder",
  ],
  defaultModel: "deepseek/deepseek-chat",
  authType: "api-key",
  envVar: "DEEPSEEK_API_KEY",
};

// Adapter class for OpenClaw integration
export class DeepSeekOpenClawAdapter {
  private provider: DeepSeekProvider;

  constructor(apiKey: string) {
    this.provider = new DeepSeekProvider({ apiKey });
  }

  /**
   * Convert OpenClaw message format to DeepSeek format
   */
  private convertMessages(messages: Array<{ role: string; content: string }>): DeepSeekMessage[] {
    return messages.map(msg => ({
      role: msg.role as "system" | "user" | "assistant",
      content: msg.content,
    }));
  }

  /**
   * Complete chat request (OpenClaw compatible)
   */
  async complete(
    model: string,
    messages: Array<{ role: string; content: string }>,
    options?: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
    }
  ): Promise<{
    content: string;
    usage: { prompt: number; completion: number; total: number };
  }> {
    // Extract model ID from full ref (e.g., "deepseek/deepseek-chat" -> "deepseek-chat")
    const modelId = model.replace("deepseek/", "");

    const request: DeepSeekRequest = {
      model: modelId,
      messages: this.convertMessages(messages),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
      top_p: options?.topP ?? 1.0,
    };

    const response = await this.provider.chatCompletion(request);
    const choice = response.choices[0];

    return {
      content: choice.message.content,
      usage: {
        prompt: response.usage.prompt_tokens,
        completion: response.usage.completion_tokens,
        total: response.usage.total_tokens,
      },
    };
  }

  /**
   * Stream chat completion (OpenClaw compatible)
   */
  async *stream(
    model: string,
    messages: Array<{ role: string; content: string }>,
    options?: {
      temperature?: number;
      maxTokens?: number;
    }
  ): AsyncGenerator<{ content: string; done: boolean }> {
    const modelId = model.replace("deepseek/", "");

    const request: DeepSeekRequest = {
      model: modelId,
      messages: this.convertMessages(messages),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
      stream: true,
    };

    const url = `https://api.deepseek.com/v1/chat/completions`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.provider}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            yield { content: "", done: true };
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || "";
            yield { content, done: false };
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  }
}

// Export factory function
export function createDeepSeekAdapter(apiKey: string): DeepSeekOpenClawAdapter {
  return new DeepSeekOpenClawAdapter(apiKey);
}
