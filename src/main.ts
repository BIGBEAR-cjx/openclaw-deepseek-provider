/**
 * OpenClaw DeepSeek Provider
 * 
 * A high-quality provider for integrating DeepSeek AI models with OpenClaw.
 * 
 * @module @openclaw/provider-deepseek
 * @version 1.0.0
 * @author BIGBEAR-cjx
 * @license MIT
 */

// Main exports
export {
  DeepSeekProvider,
  createDeepSeekProvider,
  DEEPSEEK_BASE_URL,
  DEEPSEEK_API_VERSION,
  DEEPSEEK_DEFAULT_MODEL_ID,
  DEEPSEEK_DEFAULT_MODEL_REF,
  DEEPSEEK_DEFAULT_MODEL_NAME,
  DEEPSEEK_MODEL_CATALOG,
  DEEPSEEK_COST,
} from "./index.js";

// Adapter exports
export {
  DeepSeekOpenClawAdapter,
  DEEPSEEK_PROVIDER_CONFIG,
  createDeepSeekAdapter,
} from "./adapter.js";

// Type exports
export type {
  DeepSeekModelCatalogEntry,
  DeepSeekMessage,
  DeepSeekRequest,
  DeepSeekResponse,
  DeepSeekProviderConfig,
} from "./index.js";

export type { OpenClawProvider } from "./adapter.js";

// Version
export const VERSION = "1.0.0";
