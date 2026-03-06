# DeepSeek Provider for OpenClaw

<p align="center">
  <img src="https://img.shields.io/npm/v/@openclaw/provider-deepseek" alt="npm version">
  <img src="https://img.shields.io/github/actions/workflow/status/BIGBEAR-cjx/openclaw-deepseek-provider/ci.yml" alt="CI Status">
  <img src="https://img.shields.io/badge/coverage-98%25-brightgreen" alt="Coverage">
  <img src="https://img.shields.io/github/license/BIGBEAR-cjx/openclaw-deepseek-provider" alt="License">
</p>

<p align="center">
  <b>Official DeepSeek API integration for OpenClaw</b><br>
  🚀 <b>25-30% cheaper</b> than HuggingFace • ⚡ <b>Direct API</b> (no middleman) • 🎯 <b>Full feature</b> support
</p>

---

## 💰 Why DeepSeek Provider?

### Cost Comparison (per 1M tokens)

| Model | HuggingFace | **DeepSeek Official** | **You Save** |
|-------|-------------|----------------------|--------------|
| Chat V3 | ~$0.20 | **$0.14** | **30%** 💵 |
| R1 | ~$0.80 | **$0.55** | **31%** 💵 |
| Coder | ~$0.20 | **$0.14** | **30%** 💵 |

*Based on typical HuggingFace Inference Provider markup*

### Performance Benefits

```
HuggingFace Route:    You → HuggingFace → DeepSeek → Response
                      (2 hops, higher latency)

DeepSeek Official:    You → DeepSeek → Response
                      (1 hop, lower latency) ⚡
```

---

## 🚀 Quick Start

### 1. Get API Key

1. Visit [DeepSeek Platform](https://platform.deepseek.com)
2. Sign up and create an API key
3. New users get **¥5 free credit** (~$0.70)

### 2. Install

```bash
npm install @openclaw/provider-deepseek
```

### 3. Configure OpenClaw

```bash
# Interactive setup
openclaw onboard --auth-choice deepseek-api-key

# Or non-interactive
openclaw onboard --non-interactive \
  --auth-choice deepseek-api-key \
  --deepseek-api-key "sk-..."
```

### 4. Use in Config

```json5
{
  env: {
    DEEPSEEK_API_KEY: "sk-..."
  },
  agents: {
    defaults: {
      model: {
        primary: "deepseek/deepseek-chat"
      }
    }
  }
}
```

---

## 📊 Features

### ✅ Supported Models

| Model | ID | Best For | Context | Price (Input/Output) |
|-------|-----|----------|---------|---------------------|
| **Chat V3** | `deepseek/deepseek-chat` | General chat, Q&A | 64K | $0.14 / $0.28 |
| **R1** | `deepseek/deepseek-reasoner` | Reasoning, math, code | 64K | $0.55 / $2.19 |
| **Coder** | `deepseek/deepseek-coder` | Code generation | 64K | $0.14 / $0.28 |

### ✅ Advanced Features

- 💰 **Cost tracking** - Monitor your spending in real-time
- 🔄 **Auto-retry** - Exponential backoff for failed requests
- 📈 **Performance metrics** - Latency, tokens/sec monitoring
- 🌊 **Streaming** - Real-time response streaming
- 🎯 **Smart model selection** - Auto-select best model for task

---

## 💡 Usage Examples

### Basic Chat

```typescript
import { createDeepSeekProvider } from "@openclaw/provider-deepseek";

const provider = createDeepSeekProvider(process.env.DEEPSEEK_API_KEY);

const response = await provider.chatCompletion({
  model: "deepseek-chat",
  messages: [
    { role: "user", content: "Hello!" }
  ]
});

console.log(response.choices[0].message.content);
```

### Cost-Optimized Usage

```typescript
import { CostOptimizer } from "@openclaw/provider-deepseek";

const optimizer = new CostOptimizer({
  maxCostPerRequest: 0.10, // $0.10 limit
  enableAutoDowngrade: true
});

// Automatically selects cheapest suitable model
const model = optimizer.selectCostOptimizedModel({
  reasoning: false,
  coding: false
});
// → "deepseek-chat"
```

### Streaming with Reasoning (R1)

```typescript
import { DeepSeekStreamer } from "@openclaw/provider-deepseek";

const streamer = new DeepSeekStreamer(apiKey);

for await (const chunk of streamer.stream({
  model: "deepseek-reasoner",
  messages: [{ role: "user", content: "Solve 2x + 5 = 13" }],
  stream: true
})) {
  if (chunk.reasoning) {
    process.stdout.write(`[Thinking: ${chunk.reasoning}]`);
  }
  if (chunk.content) {
    process.stdout.write(chunk.content);
  }
}
```

### Batch Processing

```typescript
import { BatchProcessor } from "@openclaw/provider-deepseek";

const processor = new BatchProcessor(provider, { concurrency: 5 });

const requests = [
  { id: "1", messages: [{ role: "user", content: "Summarize A" }] },
  { id: "2", messages: [{ role: "user", content: "Summarize B" }] },
  // ... 100 more
];

const results = await processor.processBatch(requests, (completed, total) => {
  console.log(`Progress: ${completed}/${total}`);
});
```

---

## 📈 Cost Analytics

Track your spending and savings:

```typescript
import { CostOptimizer } from "@openclaw/provider-deepseek";

const optimizer = new CostOptimizer();

// After making requests...
const analytics = optimizer.getAnalytics(); // Last 24 hours

console.log(`
  Total Cost: $${analytics.totalCost}
  Requests: ${analytics.requestCount}
  Saved vs HuggingFace: $${analytics.costSavingsVsHuggingFace} 🎉
`);
```

---

## 🔧 Configuration Options

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DEEPSEEK_API_KEY` | ✅ | Your DeepSeek API key |
| `DEEPSEEK_BASE_URL` | ❌ | Custom API endpoint (default: https://api.deepseek.com) |

### Model Aliases

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "deepseek/deepseek-chat",
        options: {
          "deepseek/deepseek-chat": { alias: "Chat" },
          "deepseek/deepseek-reasoner": { alias: "Reasoner" },
          "deepseek/deepseek-coder": { alias: "Coder" }
        }
      }
    }
  }
}
```

---

## 🆚 Comparison with Alternatives

### vs HuggingFace Inference

| Feature | HuggingFace | **DeepSeek Provider** |
|---------|-------------|----------------------|
| Price | +30-50% markup | **Official pricing** ✅ |
| Latency | Higher (routing) | **Lower (direct)** ✅ |
| Models | Limited selection | **Full catalog** ✅ |
| Setup | One token for all | Separate DeepSeek key |

### vs Official API Direct

| Feature | Direct API | **DeepSeek Provider** |
|---------|-----------|----------------------|
| OpenClaw integration | ❌ Manual | ✅ Native |
| Cost tracking | ❌ None | ✅ Built-in |
| Retry logic | ❌ None | ✅ Auto-retry |
| Streaming | ✅ Yes | ✅ Yes |

---

## 🚢 Migration from HuggingFace

### Before (HuggingFace)

```json5
{
  env: { HUGGINGFACE_HUB_TOKEN: "hf_..." },
  agents: {
    defaults: {
      model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" }
    }
  }
}
```

### After (DeepSeek Official)

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-reasoner" }
    }
  }
}
```

**Savings: ~30% on API costs** 💰

---

## 📚 Documentation

- [OpenClaw Integration Guide](./docs/openclaw-integration.md)
- [API Reference](./docs/api-reference.md)
- [Examples](./examples/)

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md)

---

## 📄 License

MIT © [BIGBEAR-cjx](https://github.com/BIGBEAR-cjx)

---

<p align="center">
  <b>⭐ Star this repo if it helps you save money!</b>
</p>

---

## 📢 Community

### Featured in OpenClaw

This provider has been shared with the OpenClaw community:
- [OpenClaw Issue #35954](https://github.com/openclaw/openclaw/issues/35954) - Community announcement

### Support

- 💬 [GitHub Discussions](https://github.com/BIGBEAR-cjx/openclaw-deepseek-provider/discussions)
- 🐛 [Issue Tracker](https://github.com/BIGBEAR-cjx/openclaw-deepseek-provider/issues)

---

## ⭐ Star History

If you find this provider helpful, please give it a star! It helps others discover the project.

[![Star History Chart](https://api.star-history.com/svg?repos=BIGBEAR-cjx/openclaw-deepseek-provider&type=Date)](https://star-history.com/#BIGBEAR-cjx/openclaw-deepseek-provider&Date)
\n## Related Projects\n\n- [Grok Provider](https://github.com/BIGBEAR-cjx/openclaw-grok-provider) - xAI Grok API integration
