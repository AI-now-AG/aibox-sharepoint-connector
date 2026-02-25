import { db, toObjectId } from "$data/mongodb";
import { ObjectId } from "mongodb";
import { z } from "zod";

export const RagConfigurationSchema = z.object({
  _id: z.instanceof(ObjectId),
  // Search Settings
  top_k: z.number().default(5),
  similarity_threshold: z.number().default(0.7),
  // Reranking
  rerank_enabled: z.boolean().default(false),
  rerank_top_n: z.number().default(5),
  rerank_candidates: z.number().default(50),
  // Hybrid Search
  hybrid_enabled: z.boolean().default(false),
  hybrid_alpha: z.number().default(0.5),
  // Multi-Query
  multi_query_enabled: z.boolean().default(false),
  multi_query_count: z.number().default(3),
  // Answerability
  answerability_enabled: z.boolean().default(false),
  answerability_threshold: z.number().default(0.6),
  // Compression
  compression_enabled: z.boolean().default(false),
  // Multi-Hop
  multihop_enabled: z.boolean().default(false),
  max_hops: z.number().default(3),
  // Timestamps
  created_at: z
    .date()
    .optional()
    .default(() => new Date()),
  updated_at: z
    .date()
    .optional()
    .default(() => new Date()),
});

export type RagConfiguration = z.infer<typeof RagConfigurationSchema>;

export const collection =
  db.collection<RagConfiguration>("ragConfigurations");

/** Default values matching backend DefaultEmbeddingConfig + DefaultRAGEnhancementConfig */
const DEFAULTS: Omit<RagConfiguration, "_id" | "created_at" | "updated_at"> = {
  top_k: 5,
  similarity_threshold: 0.7,
  rerank_enabled: false,
  rerank_top_n: 5,
  rerank_candidates: 50,
  hybrid_enabled: false,
  hybrid_alpha: 0.5,
  multi_query_enabled: false,
  multi_query_count: 3,
  answerability_enabled: false,
  answerability_threshold: 0.6,
  compression_enabled: false,
  multihop_enabled: false,
  max_hops: 3,
};

export default {
  get: async (): Promise<RagConfiguration | null> => {
    const data = collection.find();
    return (await data.toArray())?.[0] ?? null;
  },

  /**
   * Get existing config or auto-seed with defaults if none exists.
   * This ensures the page always has a document to work with.
   */
  getOrCreate: async (): Promise<RagConfiguration> => {
    const existing = await collection.findOne();
    if (existing) return existing;

    // Auto-seed with defaults using $setOnInsert for race-safety
    const now = new Date();
    const doc: RagConfiguration = {
      _id: new ObjectId(),
      ...DEFAULTS,
      created_at: now,
      updated_at: now,
    };
    await collection.updateOne(
      {},
      { $setOnInsert: doc },
      { upsert: true },
    );
    return (await collection.findOne()) as RagConfiguration;
  },

  update: async (
    id: string | ObjectId,
    update: Partial<RagConfiguration>,
  ) => {
    const objectId = toObjectId(id);
    const validated = RagConfigurationSchema.partial().parse(update);
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
