import { defineAction } from "astro:actions";
import { z } from "zod";
import GlobalApiKeysModel, {
  API_KEY_FIELDS,
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

      return {
        _id: config._id.toString(),
        ...decryptedKeys,
        _hasKeys: hasKeys,
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
