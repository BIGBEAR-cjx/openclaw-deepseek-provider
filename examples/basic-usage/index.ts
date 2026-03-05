/**
 * DeepSeek Provider - Basic Usage Example
 * 
 * This example demonstrates how to use the DeepSeek Provider
 * for cost-effective AI integration in OpenClaw.
 */

import { createDeepSeekProvider, CostOptimizer } from "@openclaw/provider-deepseek";

async function main() {
  // Initialize provider
  const provider = createDeepSeekProvider(process.env.DEEPSEEK_API_KEY!);
  
  // Example 1: Simple chat
  console.log("=== Example 1: Simple Chat ===");
  const response = await provider.chatCompletion({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "What is the capital of France?" }
    ]
  });
  
  console.log("Response:", response.choices[0].message.content);
  console.log("Tokens used:", response.usage.total_tokens);
  
  // Example 2: Cost-optimized model selection
  console.log("\n=== Example 2: Cost Optimization ===");
  const optimizer = new CostOptimizer();
  
  // For coding tasks, use Coder model
  const codingModel = optimizer.selectCostOptimizedModel({ coding: true });
  console.log("Best model for coding:", codingModel);
  
  // Estimate cost before making request
  const estimate = optimizer.estimateCost("deepseek-chat", 1000, 500);
  console.log("Estimated cost:", estimate.estimatedCost, "USD");
  console.log("Within budget:", estimate.withinBudget);
  
  // Example 3: Track actual cost
  console.log("\n=== Example 3: Cost Tracking ===");
  optimizer.trackCost("deepseek-chat", 
    response.usage.prompt_tokens,
    response.usage.completion_tokens
  );
  
  const analytics = optimizer.getAnalytics();
  console.log("Total cost today:", analytics.totalCost, "USD");
  console.log("Saved vs HuggingFace:", analytics.costSavingsVsHuggingFace, "USD 🎉");
}

main().catch(console.error);
