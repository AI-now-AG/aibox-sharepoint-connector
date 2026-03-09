import { defineAction } from "astro:actions";
import { z } from "zod";
import GlobalApiKeysModel, {
  API_KEY_FIELDS,
  CONFIG_FIELDS,
} from "$data/models/globalApiKeys.model";
import { encrypt, decrypt } from "$utils/secure";

const GlobalApiKeysUpdateSchema = z.object({
  _id: z.string(),
  openai_api_key: z.string().nullable().optional(),
  openai_gpt5_api_key: z.string().nullable().optional(),
  azure_openai_api_key: z.string().nullable().optional(),
  perplexity_api_key: z.string().nullable().optional(),
  anthropic_api_key: z.string().nullable().optional(),
  gemini_api_key: z.string().nullable().optional(),
  speech_api_key: z.string().nullable().optional(),
  elevenLabs_api_key: z.string().nullable().optional(),
  fal_ai_api_key: z.string().nullable().optional(),
  // Config fields (plain strings, not encrypted)
  azure_openai_endpoint: z.string().nullable().optional(),
  azure_openai_instance_name: z.string().nullable().optional(),
  azure_openai_chat_model: z.string().nullable().optional(),
  azure_openai_whisper_model: z.string().nullable().optional(),
  speech_region: z.string().nullable().optional(),
});

export const globalApiKeys = {
  get: defineAction({
    input: z.object({}),
    handler: async () => {
      const config = await GlobalApiKeysModel.getOrCreate();
      const decryptedKeys: Record<string, string | null> = {};
      const hasKeys: Record<string, boolean> = {};

      for (const field of API_KEY_FIELDS) {
        const raw = config[field];
        if (raw) {
          const decrypted = decrypt(raw);
          decryptedKeys[field] = decrypted || null;
          hasKeys[field] = !!decrypted;
        } else {
          decryptedKeys[field] = null;
          hasKeys[field] = false;
        }
      }

      // Config fields (plain strings, no encryption)
      const configValues: Record<string, string | null> = {};
      const hasConfig: Record<string, boolean> = {};

      for (const field of CONFIG_FIELDS) {
        const raw = config[field];
        configValues[field] = raw || null;
        hasConfig[field] = !!raw;
      }

      return {
        _id: config._id.toString(),
        ...decryptedKeys,
        ...configValues,
        _hasKeys: hasKeys,
        _hasConfig: hasConfig,
      };
    },
  }),

  update: defineAction({
    input: GlobalApiKeysUpdateSchema,
    handler: async (input) => {
      try {
        const { _id, ...keyData } = input;
        const updates: Record<string, string | null> = {};

        // Get current config to compare values
        const currentConfig = await GlobalApiKeysModel.getOrCreate();

        for (const field of API_KEY_FIELDS) {
          const value = keyData[field];
          if (value === undefined) continue;

          if (!value || value === "") {
            // Clear the key
            updates[field] = null;
          } else {
            // Check if value changed from current
            const currentDecrypted = currentConfig[field] ? decrypt(currentConfig[field]!) : null;
            if (value === currentDecrypted) continue; // No change, skip
            // New key value — encrypt before saving
            updates[field] = encrypt(value);
          }
        }

        // Handle config fields (plain strings, no encryption)
        for (const field of CONFIG_FIELDS) {
          const value = keyData[field];
          if (value === undefined) continue;

          if (!value || value === "") {
            updates[field] = null;
          } else {
            const currentValue = currentConfig[field] || null;
            if (value === currentValue) continue; // No change
            updates[field] = value; // Store as plain string
          }
        }

        if (Object.keys(updates).length === 0) {
          return { success: true };
        }

        await GlobalApiKeysModel.update(_id, updates);
        return { success: true };
      } catch (error) {
        console.error("Failed to update global API keys:", error);
        return { success: false, error: "Database update failed." };
      }
    },
  }),
};
