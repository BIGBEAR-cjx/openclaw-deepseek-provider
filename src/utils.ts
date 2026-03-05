/**
 * DeepSeek Provider Advanced Features
 * 
 * Additional utilities and enhancements for DeepSeek Provider
 */

import { DeepSeekProvider, DeepSeekRequest, DeepSeekResponse } from "./index.js";

// Token usage tracking
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: {
    input: number;
    output: number;
    total: number;
  };
}

// Conversation context manager
export class ConversationContext {
  private messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
  private maxContextLength: number;

  constructor(maxContextLength: number = 64000) {
    this.maxContextLength = maxContextLength;
  }

  addMessage(role: "system" | "user" | "assistant", content: string): void {
    this.messages.push({ role, content });
    this.trimIfNeeded();
  }

  getMessages(): Array<{ role: "system" | "user" | "assistant"; content: string }> {
    return [...this.messages];
  }

  clear(): void {
    this.messages = [];
  }

  private trimIfNeeded(): void {
    // Simple trimming strategy: keep system message and recent messages
    const totalLength = this.messages.reduce((sum, m) => sum + m.content.length, 0);
    if (totalLength > this.maxContextLength * 0.8) {
      const systemMessage = this.messages.find(m => m.role === "system");
      const recentMessages = this.messages.slice(-10);
      this.messages = systemMessage ? [systemMessage, ...recentMessages] : recentMessages;
    }
  }
}

// Cost calculator
export class CostCalculator {
  private rates: Record<string, { input: number; output: number }>;

  constructor() {
    this.rates = {
      "deepseek-chat": { input: 0.14, output: 0.28 },
      "deepseek-reasoner": { input: 0.55, output: 2.19 },
      "deepseek-coder": { input: 0.14, output: 0.28 },
    };
  }

  calculateCost(modelId: string, promptTokens: number, completionTokens: number): {
    input: number;
    output: number;
    total: number;
  } {
    const rate = this.rates[modelId] || this.rates["deepseek-chat"];
    const inputCost = (promptTokens / 1000000) * rate.input;
    const outputCost = (completionTokens / 1000000) * rate.output;
    
    return {
      input: Math.round(inputCost * 10000) / 10000,
      output: Math.round(outputCost * 10000) / 10000,
      total: Math.round((inputCost + outputCost) * 10000) / 10000,
    };
  }

  // Compare cost with HuggingFace
  compareWithHuggingFace(modelId: string, promptTokens: number, completionTokens: number): {
    deepseek: number;
    huggingface: number;
    savings: number;
    savingsPercent: number;
  } {
    const deepseekCost = this.calculateCost(modelId, promptTokens, completionTokens).total;
    // HuggingFace typically adds 30-50% markup
    const huggingfaceCost = deepseekCost * 1.4;
    const savings = huggingfaceCost - deepseekCost;
    
    return {
      deepseek: deepseekCost,
      huggingface: Math.round(huggingfaceCost * 10000) / 10000,
      savings: Math.round(savings * 10000) / 10000,
      savingsPercent: Math.round((savings / huggingfaceCost) * 100),
    };
  }
}

// Retry utility with exponential backoff
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on authentication errors
      if (error instanceof Error && error.message.includes("401")) {
        throw error;
      }
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Response formatter
export function formatResponse(response: DeepSeekResponse): {
  content: string;
  reasoning?: string;
  usage: TokenUsage;
} {
  const choice = response.choices[0];
  const content = choice.message.content;
  
  // Extract reasoning if present (for R1 model)
  const reasoningMatch = content.match(/<think>(.+?)<\/think>/s);
  const reasoning = reasoningMatch ? reasoningMatch[1].trim() : undefined;
  const cleanContent = content.replace(/<think>.+?<\/think>/s, "").trim();
  
  return {
    content: cleanContent,
    reasoning,
    usage: {
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens,
      cost: {
        input: 0,
        output: 0,
        total: 0,
      },
    },
  };
}

// Model selector based on use case
export function selectModelForUseCase(useCase: string): string {
  const useCaseLower = useCase.toLowerCase();
  
  if (useCaseLower.includes("code") || useCaseLower.includes("programming")) {
    return "deepseek-coder";
  }
  
  if (useCaseLower.includes("reason") || useCaseLower.includes("math") || useCaseLower.includes("logic")) {
    return "deepseek-reasoner";
  }
  
  return "deepseek-chat";
}

// Export all utilities
export {
  DeepSeekProvider,
  DeepSeekRequest,
  DeepSeekResponse,
};
