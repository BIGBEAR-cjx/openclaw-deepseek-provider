import { describe, expect, it, vi } from "vitest";
import {
  CostOptimizer,
  PerformanceMonitor,
  BatchProcessor,
  MigrationHelper,
} from "./market-features.js";
import { DeepSeekProvider } from "./index.js";

describe("CostOptimizer", () => {
  it("should select cheapest model for general tasks", () => {
    const optimizer = new CostOptimizer();
    const model = optimizer.selectCostOptimizedModel({});
    expect(model).toBe("deepseek-chat");
  });

  it("should select coder for coding tasks", () => {
    const optimizer = new CostOptimizer();
    const model = optimizer.selectCostOptimizedModel({ coding: true });
    expect(model).toBe("deepseek-coder");
  });

  it("should select reasoner for reasoning tasks", () => {
    const optimizer = new CostOptimizer();
    const model = optimizer.selectCostOptimizedModel({ reasoning: true });
    expect(model).toBe("deepseek-reasoner");
  });

  it("should estimate cost correctly", () => {
    const optimizer = new CostOptimizer();
    const estimate = optimizer.estimateCost("deepseek-chat", 1_000_000, 500_000);
    
    expect(estimate.estimatedCost).toBeGreaterThan(0);
    expect(estimate.withinBudget).toBe(true);
  });

  it("should suggest downgrade when over budget", () => {
    const optimizer = new CostOptimizer({ maxCostPerRequest: 0.1 });
    const estimate = optimizer.estimateCost("deepseek-reasoner", 1_000_000, 500_000);
    
    expect(estimate.withinBudget).toBe(false);
    expect(estimate.suggestedModel).toBe("deepseek-chat");
  });

  it("should track and report costs", () => {
    const optimizer = new CostOptimizer();
    optimizer.trackCost("deepseek-chat", 1_000_000, 500_000);
    optimizer.trackCost("deepseek-chat", 2_000_000, 1_000_000);
    
    const analytics = optimizer.getAnalytics();
    expect(analytics.requestCount).toBe(2);
    expect(analytics.totalCost).toBeGreaterThan(0);
    expect(analytics.costSavingsVsHuggingFace).toBeGreaterThan(0);
  });
});

describe("PerformanceMonitor", () => {
  it("should track request lifecycle", () => {
    const monitor = new PerformanceMonitor();
    monitor.startRequest("req-1", "deepseek-chat", 100);
    monitor.recordFirstToken("req-1");
    const metrics = monitor.endRequest("req-1", 50);
    
    expect(metrics.requestId).toBe("req-1");
    expect(metrics.model).toBe("deepseek-chat");
    expect(metrics.endTime).toBeDefined();
    expect(metrics.firstTokenTime).toBeDefined();
  });

  it("should generate performance report", () => {
    const monitor = new PerformanceMonitor();
    
    // Simulate some requests
    for (let i = 0; i < 5; i++) {
      monitor.startRequest(`req-${i}`, "deepseek-chat", 100);
      monitor.endRequest(`req-${i}`, 50);
    }
    
    const report = monitor.getReport();
    expect(report.totalRequests).toBe(5);
    expect(report.averageLatency).toBeGreaterThan(0);
    expect(report.errorRate).toBe(0);
  });
});

describe("MigrationHelper", () => {
  it("should map HuggingFace config to DeepSeek", () => {
    const result = MigrationHelper.fromHuggingFace({
      model: "huggingface/deepseek-ai/DeepSeek-R1",
      token: "hf-token",
    });
    
    expect(result.provider).toBe("deepseek");
    expect(result.model).toBe("deepseek/deepseek-reasoner");
    expect(result.estimatedSavings).toBe("~30%");
  });

  it("should validate API key", async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 200 });
    const result = await MigrationHelper.validateApiKey("valid-key");
    expect(result.valid).toBe(true);
  });
});
