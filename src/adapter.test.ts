import { describe, expect, it, vi } from "vitest";
import {
  DeepSeekOpenClawAdapter,
  DEEPSEEK_PROVIDER_CONFIG,
  createDeepSeekAdapter,
} from "./adapter.js";

describe("DeepSeek OpenClaw Adapter", () => {
  const mockApiKey = "sk-test123";

  describe("Adapter Initialization", () => {
    it("should create adapter with API key", () => {
      const adapter = createDeepSeekAdapter(mockApiKey);
      expect(adapter).toBeInstanceOf(DeepSeekOpenClawAdapter);
    });
  });

  describe("Provider Config", () => {
    it("should have correct provider name", () => {
      expect(DEEPSEEK_PROVIDER_CONFIG.name).toBe("deepseek");
    });

    it("should have correct auth type", () => {
      expect(DEEPSEEK_PROVIDER_CONFIG.authType).toBe("api-key");
    });

    it("should have correct env var", () => {
      expect(DEEPSEEK_PROVIDER_CONFIG.envVar).toBe("DEEPSEEK_API_KEY");
    });

    it("should have all models", () => {
      expect(DEEPSEEK_PROVIDER_CONFIG.models).toContain("deepseek/deepseek-chat");
      expect(DEEPSEEK_PROVIDER_CONFIG.models).toContain("deepseek/deepseek-reasoner");
      expect(DEEPSEEK_PROVIDER_CONFIG.models).toContain("deepseek/deepseek-coder");
    });

    it("should have correct default model", () => {
      expect(DEEPSEEK_PROVIDER_CONFIG.defaultModel).toBe("deepseek/deepseek-chat");
    });
  });

  describe("Message Conversion", () => {
    it("should convert OpenClaw messages to DeepSeek format", async () => {
      const adapter = createDeepSeekAdapter(mockApiKey);
      const messages = [
        { role: "system", content: "You are a helpful assistant" },
        { role: "user", content: "Hello" },
      ];

      // Mock the fetch call
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "Hi!" } }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        }),
      });
      global.fetch = mockFetch as unknown as typeof fetch;

      const result = await adapter.complete("deepseek/deepseek-chat", messages);
      expect(result.content).toBe("Hi!");
      expect(result.usage.total).toBe(15);
    });

    it("should handle model ID extraction", async () => {
      const adapter = createDeepSeekAdapter(mockApiKey);
      
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "Test" } }],
          usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
        }),
      });
      global.fetch = mockFetch as unknown as typeof fetch;

      await adapter.complete("deepseek/deepseek-reasoner", [{ role: "user", content: "Test" }]);
      
      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.model).toBe("deepseek-reasoner");
    });
  });

  describe("Error Handling", () => {
    it("should throw error on API failure", async () => {
      const adapter = createDeepSeekAdapter(mockApiKey);
      
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      });
      global.fetch = mockFetch as unknown as typeof fetch;

      await expect(
        adapter.complete("deepseek/deepseek-chat", [{ role: "user", content: "Test" }])
      ).rejects.toThrow("DeepSeek API error");
    });
  });
});
