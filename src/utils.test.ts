import { describe, expect, it } from "vitest";
import {
  ConversationContext,
  CostCalculator,
  withRetry,
  formatResponse,
  selectModelForUseCase,
} from "./utils.js";

describe("ConversationContext", () => {
  it("should add messages", () => {
    const context = new ConversationContext();
    context.addMessage("system", "You are a helpful assistant");
    context.addMessage("user", "Hello");
    
    expect(context.getMessages()).toHaveLength(2);
  });

  it("should clear messages", () => {
    const context = new ConversationContext();
    context.addMessage("user", "Hello");
    context.clear();
    
    expect(context.getMessages()).toHaveLength(0);
  });
});

describe("CostCalculator", () => {
  it("should calculate cost correctly", () => {
    const calculator = new CostCalculator();
    const cost = calculator.calculateCost("deepseek-chat", 1000000, 500000);
    
    expect(cost.input).toBe(0.14);
    expect(cost.output).toBe(0.14);
    expect(cost.total).toBe(0.28);
  });

  it("should compare with HuggingFace", () => {
    const calculator = new CostCalculator();
    const comparison = calculator.compareWithHuggingFace("deepseek-chat", 1000000, 500000);
    
    expect(comparison.deepseek).toBe(0.28);
    expect(comparison.huggingface).toBeGreaterThan(comparison.deepseek);
    expect(comparison.savingsPercent).toBeGreaterThan(0);
  });

  it("should use default rates for unknown model", () => {
    const calculator = new CostCalculator();
    const cost = calculator.calculateCost("unknown-model", 1000000, 500000);
    
    expect(cost.total).toBeGreaterThan(0);
  });
});

describe("withRetry", () => {
  it("should succeed on first attempt", async () => {
    const fn = async () => "success";
    const result = await withRetry(fn, 3);
    
    expect(result).toBe("success");
  });

  it("should retry on failure", async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      if (attempts < 2) throw new Error("Temporary error");
      return "success";
    };
    
    const result = await withRetry(fn, 3);
    expect(result).toBe("success");
    expect(attempts).toBe(2);
  });

  it("should throw after max retries", async () => {
    const fn = async () => {
      throw new Error("Persistent error");
    };
    
    await expect(withRetry(fn, 2)).rejects.toThrow("Persistent error");
  });

  it("should not retry on auth errors", async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      throw new Error("401 Unauthorized");
    };
    
    await expect(withRetry(fn, 3)).rejects.toThrow("401");
    expect(attempts).toBe(1);
  });
});

describe("formatResponse", () => {
  it("should format basic response", () => {
    const response = {
      id: "test-123",
      object: "chat.completion",
      created: 1234567890,
      model: "deepseek-chat",
      choices: [{
        index: 0,
        message: { role: "assistant" as const, content: "Hello!" },
        finish_reason: "stop",
      }],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 5,
        total_tokens: 15,
      },
    };
    
    const formatted = formatResponse(response);
    expect(formatted.content).toBe("Hello!");
    expect(formatted.usage.totalTokens).toBe(15);
  });

  it("should extract reasoning", () => {
    const response = {
      id: "test-123",
      object: "chat.completion",
      created: 1234567890,
      model: "deepseek-reasoner",
      choices: [{
        index: 0,
        message: { 
          role: "assistant" as const, 
          content: "<think>Let me think...</think> The answer is 42." 
        },
        finish_reason: "stop",
      }],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
      },
    };
    
    const formatted = formatResponse(response);
    expect(formatted.reasoning).toBe("Let me think...");
    expect(formatted.content).toBe("The answer is 42.");
  });
});

describe("selectModelForUseCase", () => {
  it("should select coder for code tasks", () => {
    expect(selectModelForUseCase("code generation")).toBe("deepseek-coder");
    expect(selectModelForUseCase("programming help")).toBe("deepseek-coder");
  });

  it("should select reasoner for reasoning tasks", () => {
    expect(selectModelForUseCase("math problem")).toBe("deepseek-reasoner");
    expect(selectModelForUseCase("logical reasoning")).toBe("deepseek-reasoner");
  });

  it("should select chat for general tasks", () => {
    expect(selectModelForUseCase("general chat")).toBe("deepseek-chat");
    expect(selectModelForUseCase("writing")).toBe("deepseek-chat");
  });
});
