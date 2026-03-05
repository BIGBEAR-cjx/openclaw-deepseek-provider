/**
 * DeepSeek Streaming Support
 * 
 * Provides streaming response handling for real-time output
 */

import { DeepSeekRequest } from "./index.js";

export interface StreamChunk {
  content: string;
  done: boolean;
  reasoning?: string;
}

export class DeepSeekStreamer {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = "https://api.deepseek.com") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Stream chat completion responses
   */
  async *stream(request: DeepSeekRequest & { stream: true }): AsyncGenerator<StreamChunk> {
    const url = `${this.baseUrl}/v1/chat/completions`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
        "Accept": "text/event-stream",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const chunk = this.parseLine(line);
          if (chunk) yield chunk;
        }
      }

      // Process remaining buffer
      if (buffer) {
        const chunk = this.parseLine(buffer);
        if (chunk) yield chunk;
      }
    } finally {
      reader.releaseLock();
    }

    yield { content: "", done: true };
  }

  private parseLine(line: string): StreamChunk | null {
    if (!line.startsWith("data: ")) return null;
    
    const data = line.slice(6).trim();
    if (data === "[DONE]") {
      return { content: "", done: true };
    }

    try {
      const parsed = JSON.parse(data);
      const delta = parsed.choices?.[0]?.delta;
      
      if (!delta) return null;

      return {
        content: delta.content || "",
        reasoning: delta.reasoning_content,
        done: false,
      };
    } catch {
      return null;
    }
  }
}

// Helper function to collect stream into string
export async function collectStream(
  stream: AsyncGenerator<StreamChunk>
): Promise<{ content: string; reasoning?: string }> {
  let content = "";
  let reasoning = "";

  for await (const chunk of stream) {
    if (chunk.done) break;
    content += chunk.content;
    if (chunk.reasoning) {
      reasoning += chunk.reasoning;
    }
  }

  return {
    content: content.trim(),
    reasoning: reasoning || undefined,
  };
}

// Real-time streaming handler with callbacks
export interface StreamCallbacks {
  onContent?: (content: string) => void;
  onReasoning?: (reasoning: string) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export async function streamWithCallbacks(
  stream: AsyncGenerator<StreamChunk>,
  callbacks: StreamCallbacks
): Promise<void> {
  try {
    for await (const chunk of stream) {
      if (chunk.done) {
        callbacks.onComplete?.();
        return;
      }

      if (chunk.content) {
        callbacks.onContent?.(chunk.content);
      }

      if (chunk.reasoning) {
        callbacks.onReasoning?.(chunk.reasoning);
      }
    }
  } catch (error) {
    callbacks.onError?.(error as Error);
    throw error;
  }
}
