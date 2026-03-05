/**
 * DeepSeek Provider - Market-Oriented Features
 * 
 * Features designed for product-market fit:
 * - Cost optimization for price-sensitive users
 * - Performance monitoring for enterprise users
 * - Easy onboarding for new users
 * - Batch processing for high-volume users
 */

import { DeepSeekProvider, DeepSeekRequest, DeepSeekResponse, DEEPSEEK_COST } from "./index.js";

// ==================== 1. 成本优化功能 ====================

export interface CostOptimizationConfig {
  /** Maximum cost per request in USD */
  maxCostPerRequest?: number;
  /** Enable automatic model downgrading if cost exceeds threshold */
  enableAutoDowngrade?: boolean;
  /** Preferred model order by cost (cheapest first) */
  costOptimizedModelOrder?: string[];
}

export class CostOptimizer {
  private config: CostOptimizationConfig;
  private costHistory: Array<{ timestamp: number; cost: number; model: string }> = [];

  constructor(config: CostOptimizationConfig = {}) {
    this.config = {
      maxCostPerRequest: 0.5, // $0.50 default limit
      enableAutoDowngrade: true,
      costOptimizedModelOrder: ["deepseek-chat", "deepseek-coder", "deepseek-reasoner"],
      ...config,
    };
  }

  /**
   * Select cheapest model that can handle the task
   */
  selectCostOptimizedModel(
    requiredCapabilities: { reasoning?: boolean; coding?: boolean }
  ): string {
    if (requiredCapabilities.coding) return "deepseek-coder";
    if (requiredCapabilities.reasoning) return "deepseek-reasoner";
    return "deepseek-chat"; // Cheapest for general tasks
  }

  /**
   * Estimate cost before making request
   */
  estimateCost(model: string, estimatedInputTokens: number, estimatedOutputTokens: number): {
    estimatedCost: number;
    withinBudget: boolean;
    suggestedModel?: string;
  } {
    const rates = DEEPSEEK_COST[model as keyof typeof DEEPSEEK_COST];
    if (!rates) {
      return { estimatedCost: 0, withinBudget: false };
    }

    const inputCost = (estimatedInputTokens / 1_000_000) * rates.input;
    const outputCost = (estimatedOutputTokens / 1_000_000) * rates.output;
    const totalCost = inputCost + outputCost;

    const withinBudget = !this.config.maxCostPerRequest || 
                         totalCost <= this.config.maxCostPerRequest;

    let suggestedModel: string | undefined;
    if (!withinBudget && this.config.enableAutoDowngrade) {
      // Suggest cheaper alternative
      if (model === "deepseek-reasoner") suggestedModel = "deepseek-chat";
    }

    return {
      estimatedCost: Math.round(totalCost * 10000) / 10000,
      withinBudget,
      suggestedModel,
    };
  }

  /**
   * Track actual cost after request
   */
  trackCost(model: string, promptTokens: number, completionTokens: number): number {
    const rates = DEEPSEEK_COST[model as keyof typeof DEEPSEEK_COST];
    if (!rates) return 0;

    const cost = ((promptTokens / 1_000_000) * rates.input) +
                 ((completionTokens / 1_000_000) * rates.output);

    this.costHistory.push({
      timestamp: Date.now(),
      cost: Math.round(cost * 10000) / 10000,
      model,
    });

    // Keep only last 1000 entries
    if (this.costHistory.length > 1000) {
      this.costHistory = this.costHistory.slice(-1000);
    }

    return cost;
  }

  /**
   * Get cost analytics
   */
  getAnalytics(timeWindowMs: number = 24 * 60 * 60 * 1000): {
    totalCost: number;
    requestCount: number;
    averageCost: number;
    mostUsedModel: string;
    costSavingsVsHuggingFace: number;
  } {
    const cutoff = Date.now() - timeWindowMs;
    const recent = this.costHistory.filter(h => h.timestamp > cutoff);

    if (recent.length === 0) {
      return {
        totalCost: 0,
        requestCount: 0,
        averageCost: 0,
        mostUsedModel: "none",
        costSavingsVsHuggingFace: 0,
      };
    }

    const totalCost = recent.reduce((sum, h) => sum + h.cost, 0);
    const modelCounts: Record<string, number> = {};
    recent.forEach(h => {
      modelCounts[h.model] = (modelCounts[h.model] || 0) + 1;
    });
    const mostUsedModel = Object.entries(modelCounts)
      .sort((a, b) => b[1] - a[1])[0][0];

    // Assume 40% markup on HuggingFace
    const costSavingsVsHuggingFace = totalCost * 0.4;

    return {
      totalCost: Math.round(totalCost * 100) / 100,
      requestCount: recent.length,
      averageCost: Math.round((totalCost / recent.length) * 10000) / 10000,
      mostUsedModel,
      costSavingsVsHuggingFace: Math.round(costSavingsVsHuggingFace * 100) / 100,
    };
  }
}

// ==================== 2. 性能监控功能 ====================

export interface PerformanceMetrics {
  requestId: string;
  model: string;
  startTime: number;
  endTime?: number;
  firstTokenTime?: number;
  promptTokens: number;
  completionTokens: number;
  error?: string;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private activeRequests: Map<string, PerformanceMetrics> = new Map();

  startRequest(requestId: string, model: string, promptTokens: number): void {
    this.activeRequests.set(requestId, {
      requestId,
      model,
      startTime: Date.now(),
      promptTokens,
      completionTokens: 0,
    });
  }

  recordFirstToken(requestId: string): void {
    const metrics = this.activeRequests.get(requestId);
    if (metrics) {
      metrics.firstTokenTime = Date.now();
    }
  }

  endRequest(
    requestId: string,
    completionTokens: number,
    error?: string
  ): PerformanceMetrics {
    const metrics = this.activeRequests.get(requestId);
    if (!metrics) {
      throw new Error(`Request ${requestId} not found`);
    }

    metrics.endTime = Date.now();
    metrics.completionTokens = completionTokens;
    if (error) metrics.error = error;

    this.metrics.push({ ...metrics });
    this.activeRequests.delete(requestId);

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    return metrics;
  }

  /**
   * Get performance report
   */
  getReport(): {
    averageLatency: number;
    averageTimeToFirstToken: number;
    tokensPerSecond: number;
    errorRate: number;
    totalRequests: number;
  } {
    if (this.metrics.length === 0) {
      return {
        averageLatency: 0,
        averageTimeToFirstToken: 0,
        tokensPerSecond: 0,
        errorRate: 0,
        totalRequests: 0,
      };
    }

    const completed = this.metrics.filter(m => m.endTime);
    const withErrors = this.metrics.filter(m => m.error);
    const withFirstToken = completed.filter(m => m.firstTokenTime);

    const averageLatency = completed.reduce((sum, m) => 
      sum + (m.endTime! - m.startTime), 0) / completed.length;

    const averageTimeToFirstToken = withFirstToken.reduce((sum, m) =>
      sum + (m.firstTokenTime! - m.startTime), 0) / withFirstToken.length;

    const totalTokens = completed.reduce((sum, m) =>
      sum + m.completionTokens, 0);
    const totalTime = completed.reduce((sum, m) =>
      sum + (m.endTime! - m.startTime), 0) / 1000; // Convert to seconds

    return {
      averageLatency: Math.round(averageLatency),
      averageTimeToFirstToken: Math.round(averageTimeToFirstToken),
      tokensPerSecond: Math.round((totalTokens / totalTime) * 100) / 100,
      errorRate: Math.round((withErrors.length / this.metrics.length) * 10000) / 100,
      totalRequests: this.metrics.length,
    };
  }
}

// ==================== 3. 批量处理功能 ====================

export interface BatchRequest {
  id: string;
  messages: Array<{ role: string; content: string }>;
  model?: string;
  priority?: number; // Higher = more important
}

export interface BatchResult {
  id: string;
  success: boolean;
  content?: string;
  error?: string;
  tokensUsed?: number;
  cost?: number;
  latency?: number;
}

export class BatchProcessor {
  private provider: DeepSeekProvider;
  private concurrency: number;
  private retryFailed: boolean;

  constructor(
    provider: DeepSeekProvider,
    options: { concurrency?: number; retryFailed?: boolean } = {}
  ) {
    this.provider = provider;
    this.concurrency = options.concurrency || 5;
    this.retryFailed = options.retryFailed ?? true;
  }

  /**
   * Process multiple requests with concurrency control
   */
  async processBatch(
    requests: BatchRequest[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<BatchResult[]> {
    const results: BatchResult[] = [];
    const queue = [...requests].sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    const processRequest = async (req: BatchRequest): Promise<BatchResult> => {
      const startTime = Date.now();
      try {
        // Note: This is a simplified version. In real implementation,
        // you'd use the actual provider.chatCompletion method
        const result = await this.provider.chatCompletion({
          model: req.model || "deepseek-chat",
          messages: req.messages as any,
        });

        return {
          id: req.id,
          success: true,
          content: result.choices[0].message.content,
          tokensUsed: result.usage.total_tokens,
          latency: Date.now() - startTime,
        };
      } catch (error) {
        return {
          id: req.id,
          success: false,
          error: (error as Error).message,
          latency: Date.now() - startTime,
        };
      }
    };

    // Process with concurrency limit
    const executing: Promise<void>[] = [];
    let completed = 0;

    for (const req of queue) {
      const promise = processRequest(req).then(result => {
        results.push(result);
        completed++;
        onProgress?.(completed, requests.length);
      });

      executing.push(promise);

      if (executing.length >= this.concurrency) {
        await Promise.race(executing);
        executing.splice(executing.findIndex(p => p === promise), 1);
      }
    }

    await Promise.all(executing);

    // Retry failed requests if enabled
    if (this.retryFailed) {
      const failed = results.filter(r => !r.success);
      for (const fail of failed) {
        const originalReq = requests.find(r => r.id === fail.id);
        if (originalReq) {
          const retry = await processRequest(originalReq);
          const idx = results.findIndex(r => r.id === fail.id);
          if (idx >= 0) results[idx] = retry;
        }
      }
    }

    return results;
  }
}

// ==================== 4. 易用性：一键迁移工具 ====================

export class MigrationHelper {
  /**
   * Generate configuration from HuggingFace setup
   */
  static fromHuggingFace(hfConfig: {
    model: string;
    token: string;
  }): {
    provider: "deepseek";
    model: string;
    estimatedSavings: string;
    config: object;
  } {
    // Map HuggingFace model to DeepSeek model
    let deepseekModel = "deepseek-chat";
    if (hfConfig.model.includes("R1") || hfConfig.model.includes("reasoner")) {
      deepseekModel = "deepseek-reasoner";
    } else if (hfConfig.model.includes("coder")) {
      deepseekModel = "deepseek-coder";
    }

    return {
      provider: "deepseek",
      model: `deepseek/${deepseekModel}`,
      estimatedSavings: "~30%",
      config: {
        env: { DEEPSEEK_API_KEY: "your-deepseek-api-key" },
        agents: {
          defaults: {
            model: { primary: `deepseek/${deepseekModel}` },
          },
        },
      },
    };
  }

  /**
   * Validate DeepSeek API key
   */
  static async validateApiKey(apiKey: string): Promise<{
    valid: boolean;
    message: string;
  }> {
    try {
      const response = await fetch("https://api.deepseek.com/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (response.status === 200) {
        return { valid: true, message: "API key is valid" };
      } else if (response.status === 401) {
        return { valid: false, message: "Invalid API key" };
      } else {
        return { valid: false, message: `Error: ${response.status}` };
      }
    } catch (error) {
      return { valid: false, message: `Network error: ${(error as Error).message}` };
    }
  }
}
