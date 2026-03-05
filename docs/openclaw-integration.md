---
summary: "DeepSeek official API provider for OpenClaw"
read_when:
  - You want to use DeepSeek models directly (not via HuggingFace)
  - You need cost-effective DeepSeek API access
  - You want reasoning model support
title: "DeepSeek"
---

# DeepSeek

DeepSeek provides official API access to their language models including DeepSeek Chat (V3), Reasoner (R1), and Coder. This provider offers **direct API integration** without middlemen, providing better pricing and performance compared to routing through HuggingFace.

## Why Use This Provider?

| Feature | DeepSeek Provider | HuggingFace Route |
|---------|------------------|-------------------|
| **Pricing** | Official rates | +20-50% markup |
| **Latency** | Direct connection | Via HF router |
| **Models** | All DeepSeek models | Limited selection |
| **Reasoning** | Full R1 support | Basic support |

## Quick Start

### 1. Get API Key

1. Visit [DeepSeek Platform](https://platform.deepseek.com)
2. Create an account
3. Generate an API key

### 2. Install Provider

```bash
npm install @openclaw/provider-deepseek
```

### 3. Configure OpenClaw

```bash
openclaw onboard --auth-choice deepseek-api-key
# Enter your DeepSeek API key when prompted
```

Or manual configuration:

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-chat" }
    }
  }
}
```

## Available Models

### deepseek-chat (V3)
- **ID**: `deepseek/deepseek-chat`
- **Context**: 64K tokens
- **Max Output**: 8K tokens
- **Best for**: General chat, Q&A, content generation
- **Cost**: $0.14/1M input, $0.28/1M output

### deepseek-reasoner (R1)
- **ID**: `deepseek/deepseek-reasoner`
- **Context**: 64K tokens
- **Max Output**: 8K tokens
- **Best for**: Complex reasoning, math, coding
- **Cost**: $0.55/1M input, $2.19/1M output
- **Features**: Chain-of-thought reasoning

### deepseek-coder
- **ID**: `deepseek/deepseek-coder`
- **Context**: 64K tokens
- **Max Output**: 8K tokens
- **Best for**: Code generation, code review
- **Cost**: $0.14/1M input, $0.28/1M output

## Configuration Examples

### Basic Setup
```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-chat" }
    }
  }
}
```

### With Fallback
```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "deepseek/deepseek-reasoner",
        fallback: "deepseek/deepseek-chat"
      }
    }
  }
}
```

### Multiple Models
```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
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

## Advanced Usage

### Using Reasoning Model

```typescript
import { createDeepSeekAdapter } from "@openclaw/provider-deepseek";

const adapter = createDeepSeekAdapter(process.env.DEEPSEEK_API_KEY);

const result = await adapter.complete(
  "deepseek/deepseek-reasoner",
  [
    { role: "user", content: "Solve this math problem: 2x + 5 = 13" }
  ]
);

console.log(result.content);
// Shows step-by-step reasoning
```

### Streaming Responses

```typescript
for await (const chunk of adapter.stream(
  "deepseek/deepseek-chat",
  [{ role: "user", content: "Tell me a story" }]
)) {
  process.stdout.write(chunk.content);
}
```

## Cost Comparison

| Model | DeepSeek Official | HuggingFace | Savings |
|-------|------------------|-------------|---------|
| Chat V3 | $0.14/$0.28 | ~$0.20/$0.40 | 30% |
| R1 | $0.55/$2.19 | ~$0.80/$3.00 | 25% |
| Coder | $0.14/$0.28 | ~$0.20/$0.40 | 30% |

## Troubleshooting

### API Key Issues
```
Error: DeepSeek API error: 401
```
- Verify your API key is correct
- Check if your account has available credits

### Model Not Found
```
Error: Model not found
```
- Use correct model ID: `deepseek-chat`, not `deepseek-v3`

### Rate Limits
DeepSeek API has rate limits. For high-volume usage, consider:
- Implementing retry logic
- Using multiple API keys
- Upgrading your DeepSeek plan

## Links

- [DeepSeek Platform](https://platform.deepseek.com)
- [DeepSeek API Docs](https://platform.deepseek.com/docs)
- [GitHub Repository](https://github.com/BIGBEAR-cjx/openclaw-deepseek-provider)

## License

MIT © BIGBEAR-cjx
