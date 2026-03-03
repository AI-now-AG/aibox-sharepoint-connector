import { db, toObjectId } from "$data/mongodb";
import { ObjectId } from "mongodb";
import { z } from "zod";

export const GlobalApiKeysSchema = z.object({
  _id: z.instanceof(ObjectId),
  openai_api_key: z.string().nullable().default(null),
  openai_gpt5_api_key: z.string().nullable().default(null),
  azure_openai_api_key: z.string().nullable().default(null),
  perplexity_api_key: z.string().nullable().default(null),
  anthropic_api_key: z.string().nullable().default(null),
  gemini_api_key: z.string().nullable().default(null),
  speech_api_key: z.string().nullable().default(null),
  elevenLabs_api_key: z.string().nullable().default(null),
  fal_ai_api_key: z.string().nullable().default(null),
  created_at: z
    .date()
    .optional()
    .default(() => new Date()),
  updated_at: z
    .date()
    .optional()
    .default(() => new Date()),
});

export type GlobalApiKeys = z.infer<typeof GlobalApiKeysSchema>;

export const API_KEY_FIELDS = [
  "openai_api_key",
  "openai_gpt5_api_key",
  "azure_openai_api_key",
  "perplexity_api_key",
  "anthropic_api_key",
  "gemini_api_key",
  "speech_api_key",
  "elevenLabs_api_key",
  "fal_ai_api_key",
] as const;

export type ApiKeyField = (typeof API_KEY_FIELDS)[number];

export const collection = db.collection<GlobalApiKeys>("globalApiKeys");

export default {
  get: async (): Promise<GlobalApiKeys | null> => {
    return (await collection.findOne()) ?? null;
  },

  getOrCreate: async (): Promise<GlobalApiKeys> => {
    const existing = await collection.findOne();
    if (existing) return existing;

    const now = new Date();
    const doc: GlobalApiKeys = {
      _id: new ObjectId(),
      openai_api_key: null,
      openai_gpt5_api_key: null,
      azure_openai_api_key: null,
      perplexity_api_key: null,
      anthropic_api_key: null,
      gemini_api_key: null,
      speech_api_key: null,
      elevenLabs_api_key: null,
      fal_ai_api_key: null,
      created_at: now,
      updated_at: now,
    };
    await collection.updateOne({}, { $setOnInsert: doc }, { upsert: true });
    return (await collection.findOne()) as GlobalApiKeys;
  },

  update: async (id: string | ObjectId, update: Partial<GlobalApiKeys>) => {
    const objectId = toObjectId(id);
    const validated = GlobalApiKeysSchema.partial().parse(update);
    const doc = {
      ...validated,
      updated_at: new Date(),
    };
    return await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: doc },
      { returnDocument: "after" },
    );
  },
};
