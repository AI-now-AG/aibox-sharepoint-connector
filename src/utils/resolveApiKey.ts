import GlobalApiKeysModel, {
  type GlobalApiKeys,
  type ApiKeyField,
} from "$data/models/globalApiKeys.model";
import { decrypt } from "./secure";

/**
 * Maps each API key field to the tenant metadata flag that enables private key usage.
 * Mirrors the backend's KEY_TO_PRIVATE_FLAG.
 */
const KEY_TO_PRIVATE_FLAG: Record<ApiKeyField, string> = {
  openai_api_key: "openaiPrivateKeyEnabled",
  openai_gpt5_api_key: "openaiGpt5PrivateKeyEnabled",
  azure_openai_api_key: "azureOpenaiPrivateKeyEnabled",
  perplexity_api_key: "perplexityPrivateKeyEnabled",
  anthropic_api_key: "claudePrivateKeyEnabled",
  gemini_api_key: "geminiPrivateKeyEnabled",
  speech_api_key: "speechPrivateKeyEnabled",
  elevenLabs_api_key: "elevenLabsPrivateKeyEnabled",
  fal_ai_api_key: "fluxPrivateKeyEnabled",
};

let cache: GlobalApiKeys | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000; // 1 minute

/**
 * Get the global API keys singleton document (cached for 1 minute).
 */
export async function getGlobalApiKeys(): Promise<GlobalApiKeys | null> {
  if (cache && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cache;
  }
  const config = await GlobalApiKeysModel.get();
  if (config) {
    cache = config;
    cacheTimestamp = Date.now();
  }
  return config;
}

/**
 * Resolve an API key using the 3-tier chain:
 *   1. Tenant private key (if privateKeyEnabled flag is true AND tenant has a key)
 *   2. Global key (if set)
 *   3. Environment variable fallback
 *
 * All stored keys (tenant + global) are encrypted — this function decrypts them.
 */
export function resolveApiKey(
  keyName: ApiKeyField,
  tenant: any,
  globalKeys: GlobalApiKeys | null,
  envFallback: string = "",
): string {
  const privateFlag = KEY_TO_PRIVATE_FLAG[keyName];

  // 1. Tenant private key
  if (tenant?.metadata?.[privateFlag] && tenant[keyName]) {
    const decrypted = decrypt(tenant[keyName]);
    if (decrypted) return decrypted;
  }

  // 2. Global key
  if (globalKeys) {
    const globalValue = globalKeys[keyName];
    if (globalValue) {
      const decrypted = decrypt(globalValue);
      if (decrypted) return decrypted;
    }
  }

  // 3. Environment variable fallback
  return envFallback;
}
