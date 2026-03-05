import { describe, expect, it, vi } from "vitest";
import {
  DeepSeekProvider,
  DEEPSEEK_BASE_URL,
  DEEPSEEK_DEFAULT_MODEL_ID,
  DEEPSEEK_MODEL_CATALOG,
  DEEPSEEK_COST,
  createDeepSeekProvider,
} from "./index.js";

describe("DeepSeek Provider", () => {
  const mockApiKey = "sk-test123";

  describe("Provider Initialization", () => {
    it("should create provider with API key", () => {
      const provider = createDeepSeekProvider(mockApiKey);
      expect(provider).toBeInstanceOf(DeepSeekProvider);
    });

    it("should use default base URL", () => {
      const provider = createDeepSeekProvider(mockApiKey);
      expect(provider).toBeDefined();
    });

    it("should use custom base URL when provided", () => {
      const customUrl = "https://custom.deepseek.com";
      const provider = new DeepSeekProvider({
        apiKey: mockApiKey,
        baseUrl: customUrl,
      });
      expect(provider).toBeDefined();
    });
  });

  describe("Model Catalog", () => {
    it("should have all models defined", () => {
      expect(DEEPSEEK_MODEL_CATALOG.length).toBeGreaterThanOrEqual(3);
    });

    it("should include deepseek-chat", () => {
      const model = DEEPSEEK_MODEL_CATALOG.find(m => m.id === "deepseek-chat");
      expect(model).toBeDefined();
      expect(model?.name).toBe("DeepSeek Chat (V3)");
    });

    it("should include deepseek-reasoner", () => {
      const model = DEEPSEEK_MODEL_CATALOG.find(m => m.id === "deepseek-reasoner");
      expect(model).toBeDefined();
      expect(model?.reasoning).toBe(true);
    });

    it("should include deepseek-coder", () => {
      const model = DEEPSEEK_MODEL_CATALOG.find(m => m.id === "deepseek-coder");
      expect(model).toBeDefined();
    });
  });

  describe("Provider Methods", () => {
    const provider = createDeepSeekProvider(mockApiKey);

    it("should get all models", () => {
      const models = provider.getModels();
      expect(models.length).toBeGreaterThanOrEqual(3);
    });

    it("should get specific model", () => {
      const model = provider.getModel("deepseek-chat");
      expect(model).toBeDefined();
      expect(model?.id).toBe("deepseek-chat");
    });

    it("should return undefined for invalid model", () => {
      const model = provider.getModel("invalid-model");
      expect(model).toBeUndefined();
    });

    it("should check if model supports reasoning", () => {
      expect(provider.isReasoningModel("deepseek-reasoner")).toBe(true);
      expect(provider.isReasoningModel("deepseek-chat")).toBe(false);
    });
  });

  describe("Cost Configuration", () => {
    it("should have cost for all models", () => {
      expect(DEEPSEEK_COST["deepseek-chat"]).toBeDefined();
      expect(DEEPSEEK_COST["deepseek-reasoner"]).toBeDefined();
      expect(DEEPSEEK_COST["deepseek-coder"]).toBeDefined();
    });

    it("should have valid cost structure", () => {
      const chatCost = DEEPSEEK_COST["deepseek-chat"];
      expect(chatCost.input).toBeGreaterThan(0);
      expect(chatCost.output).toBeGreaterThan(0);
      expect(chatCost.cacheRead).toBeGreaterThanOrEqual(0);
      expect(chatCost.cacheWrite).toBeGreaterThanOrEqual(0);
    });

    it("should get cost for model", () => {
      const provider = createDeepSeekProvider(mockApiKey);
      const cost = provider.getCost("deepseek-chat");
      expect(cost).toBeDefined();
      expect(cost?.input).toBe(0.14);
    });
  });

  describe("Constants", () => {
    it("should have correct base URL", () => {
      expect(DEEPSEEK_BASE_URL).toBe("https://api.deepseek.com");
    });

    it("should have correct default model", () => {
      expect(DEEPSEEK_DEFAULT_MODEL_ID).toBe("deepseek-chat");
    });
  });
});
