import { defineAction } from "astro:actions";
import { z } from "zod";
import RagConfigurationModel from "$data/models/ragConfiguration.model";

const RagConfigUpdateSchema = z.object({
  _id: z.string(),
  top_k: z.number().optional(),
  similarity_threshold: z.number().optional(),
  rerank_enabled: z.boolean().optional(),
  rerank_top_n: z.number().optional(),
  rerank_candidates: z.number().optional(),
  hybrid_enabled: z.boolean().optional(),
  hybrid_alpha: z.number().optional(),
  multi_query_enabled: z.boolean().optional(),
  multi_query_count: z.number().optional(),
  answerability_enabled: z.boolean().optional(),
  answerability_threshold: z.number().optional(),
  compression_enabled: z.boolean().optional(),
  multihop_enabled: z.boolean().optional(),
  max_hops: z.number().optional(),
});

export const ragConfiguration = {
  get: defineAction({
    input: z.object({}),
    handler: async () => {
      const config = await RagConfigurationModel.getOrCreate();
      return config;
    },
  }),

  update: defineAction({
    input: RagConfigUpdateSchema,
    handler: async (input) => {
      try {
        const { _id, ...updateData } = input;

        const update: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(updateData)) {
          if (value !== undefined) {
            update[key] = value;
          }
        }

        if (Object.keys(update).length === 0) {
          throw new Error("No valid fields to update.");
        }

        await RagConfigurationModel.update(_id, update);
        return { success: true };
      } catch (error) {
        console.error("Failed to update RAG configuration:", error);
        return { success: false, error: "Database update failed." };
      }
    },
  }),
};
