/**
 * DeepSeek Provider for OpenClaw
 * 
 * Provides direct integration with DeepSeek API
 * Supports: deepseek-chat, deepseek-reasoner, deepseek-coder
 */

export const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
export const DEEPSEEK_API_VERSION = "v1";

// Default model configurations
export const DEEPSEEK_DEFAULT_MODEL_ID = "deepseek-chat";
export const DEEPSEEK_DEFAULT_MODEL_REF = `deepseek/${DEEPSEEK_DEFAULT_MODEL_ID}`;
export const DEEPSEEK_DEFAULT_MODEL_NAME = "DeepSeek Chat (V3)";

// Model catalog with specifications
export type DeepSeekModelCatalogEntry = {
  id: string;
  name: string;
  reasoning: boolean;
  input: Array<"text" | "image">;
  contextWindow: number;
  maxTokens: number;
  description?: string;
};

export const DEEPSEEK_MODEL_CATALOG: DeepSeekModelCatalogEntry[] = [
  {
    id: "deepseek-chat",
    name: "DeepSeek Chat (V3)",
    reasoning: false,
    input: ["text"],
    contextWindow: 64000,
    maxTokens: 8192,
    description: "General purpose chat model",
  },
  {
    id: "deepseek-reasoner",
    name: "DeepSeek Reasoner (R1)",
    reasoning: true,
    input: ["text"],
    contextWindow: 64000,
    maxTokens: 8192,
    description: "Reasoning model with chain-of-thought",
  },
  {
    id: "deepseek-coder",
    name: "DeepSeek Coder",
    reasoning: false,
    input: ["text"],
    contextWindow: 64000,
    maxTokens: 8192,
    description: "Code generation and understanding",
  },
];

// Cost configuration (per 1M tokens in USD)
export const DEEPSEEK_COST = {
  "deepseek-chat": {
    input: 0.14,
    output: 0.28,
    cacheRead: 0.014,
    cacheWrite: 0.14,
  },
  "deepseek-reasoner": {
    input: 0.55,
    output: 2.19,
    cacheRead: 0.14,
    cacheWrite: 0.55,
  },
  "deepseek-coder": {
    input: 0.14,
    output: 0.28,
    cacheRead: 0.014,
    cacheWrite: 0.14,
  },
} as const;

// API types
export interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface DeepSeekRequest {
  model: string;
  messages: DeepSeekMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
  reasoning?: boolean;
}

export interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: DeepSeekMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Provider configuration
export interface DeepSeekProviderConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
}

// Main provider class
export class DeepSeekProvider {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;

  constructor(config: DeepSeekProviderConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || DEEPSEEK_BASE_URL;
    this.defaultModel = config.defaultModel || DEEPSEEK_DEFAULT_MODEL_ID;
  }

  /**
   * Get available models
   */
  getModels(): DeepSeekModelCatalogEntry[] {
    return DEEPSEEK_MODEL_CATALOG;
  }

  /**
   * Get model by ID
   */
  getModel(modelId: string): DeepSeekModelCatalogEntry | undefined {
    return DEEPSEEK_MODEL_CATALOG.find(m => m.id === modelId);
  }

  /**
   * Check if model supports reasoning
   */
  isReasoningModel(modelId: string): boolean {
    const model = this.getModel(modelId);
    return model?.reasoning || false;
  }

  /**
   * Create chat completion
   */
  async chatCompletion(request: DeepSeekRequest): Promise<DeepSeekResponse> {
    const url = `${this.baseUrl}/${DEEPSEEK_API_VERSION}/chat/completions`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        ...request,
        model: request.model || this.defaultModel,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get cost for model
   */
  getCost(modelId: string): typeof DEEPSEEK_COST[keyof typeof DEEPSEEK_COST] | undefined {
    return DEEPSEEK_COST[modelId as keyof typeof DEEPSEEK_COST];
  }
}

// Export singleton instance creator
export function createDeepSeekProvider(apiKey: string): DeepSeekProvider {
  return new DeepSeekProvider({ apiKey });
}

// Default export
export default DeepSeekProvider;
