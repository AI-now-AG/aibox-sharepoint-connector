import { z } from "zod";

export const CreateKnowledgeBaseParamsSchema = z.object({
  _id: z.string().optional(),
  title: z.string(),
  knowledge_base: z.string(),
});

export type CreateKnowledgeBaseParams = z.infer<
  typeof CreateKnowledgeBaseParamsSchema
>;

export const KnowledgeBaseParamsSchema = z.object({
  _id: z.string(),
});

export type KnowledgeBaseParams = z.infer<typeof KnowledgeBaseParamsSchema>;
