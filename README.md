# OpenClaw DeepSeek Provider

Official DeepSeek API provider for OpenClaw.

## Features

- Direct DeepSeek API integration (no middleman)
- Support for DeepSeek R1, V3, and V3.2 models
- Reasoning model support
- Cost-effective pricing vs HuggingFace

## Installation

```bash
npm install @openclaw/provider-deepseek
```

## Configuration

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

## Models

- deepseek-chat (V3)
- deepseek-reasoner (R1)
- deepseek-coder

## License

MIT
