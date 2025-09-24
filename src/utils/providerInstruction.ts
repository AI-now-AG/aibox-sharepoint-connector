import { ApiKeyProvider } from "$types/TenantFeature";
import { type Configuration } from "$data/models/configuration.model";
import { ProviderMap } from "$shared/AIProvider";

/**
 * Retrieves the instruction text to guide an AI provider’s behavior.
 * Falls back to the "default" provider if no instruction is found.
 *
 * @param {Configuration} config - The global configuration object containing provider instructions.
 * @param {ApiKeyProvider} provider - The provider identifier string (e.g., "openai").
 * @param {string | null} [model] - The model name (optional).
 * @param {string} [language='en'] - The preferred language for the instruction.
 * @returns {string | null}
 */
export function getProviderInstruction(
  config: Configuration,
  provider: ApiKeyProvider,
  model: string,
  language: string = "en",
): string | null {

  // Resolve the config provider key from request provider
  const providerKey = ProviderMap[provider];

  // Attempt to fetch an instruction for the provider/model
  let instruction = resolveInstruction(
    config,
    providerKey ?? "default",
    model,
    language,
  );

  console.log("[providerInstruction] get provider instruction", {
    provider,
    model: model,
    instruction,
  });

  // Fallback to "default" instructions if provider-specific is missing
  if (!instruction) {
    instruction = resolveInstruction(config, "default", null, language);
    console.log("[providerInstruction] Fallback to default instruction", {
      instruction,
    });
  }

  return instruction;
}

/**
 * Retrieves an instruction string from the configuration based on:
 * - AI provider (e.g., openai, claude, gemini, etc.)
 * - Specific model if available
 * - Preferred language (defaults to English)
 *
 * @param {Configuration} config - The global configuration object.
 * @param {string} provider - The provider identifier string (e.g., "openai").
 * @param {string | null} [model] - The model name (optional).
 * @param {string} [language='en'] - The preferred language for the instruction.
 * @returns {string | null}
 */
export function resolveInstruction(
  config: Configuration | null,
  provider: string,
  model?: string | null,
  language: string = "en",
): string | null {
  if (!config) return null;

  // Find provider-specific configuration
  const providerConfig = config.defaultInstructions.find(
    (p) => p.provider === provider,
  );
  if (!providerConfig) return null;

  // Prefer model-specific instruction if it exists
  if (model && providerConfig.models && providerConfig.models[model]) {
    const instruction = providerConfig.models[model].instruction as Record<
      string,
      string
    >;
    if (instruction && instruction[language]) {
      return instruction[language];
    }
  }

  // Fallback to provider-level instruction
  const instruction = providerConfig.instruction as Record<string, string>;
  return instruction[language] ?? null;
}
