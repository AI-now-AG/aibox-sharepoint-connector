import { z } from "zod";
import { ReasoningEffortOption, VectorKBScope } from "./AIProvider";

export const CreatePromptParamsSchema = z.object({
  _id: z.string().optional(),
  title: z.string(),
  category: z.string().optional(),
  group: z.string().optional(),
  knowledgebase: z.array(z.string().optional()),
  prompt: z.string(),
  predefined_input: z.string().optional(),
  model: z.string().nullish(),
  reasoningEffort: z.string().nullish().default(ReasoningEffortOption.None),
  textVerbosity: z.string().nullish(),
  promptTool: z.string().nullish(),
  documents: z.array(z.string()).optional(),
  // Vector KB fields
  vector_kb_enabled: z.boolean().optional().default(false),
  vector_kb_scope: z.nativeEnum(VectorKBScope).nullish(),
  vector_kb_folder_ids: z.array(z.string()).optional(),
  vector_kb_data_source_ids: z.array(z.string()).optional(),
});

export type CreatePromptParams = z.infer<typeof CreatePromptParamsSchema>;
export const PromptParamsSchema = z.object({
  _id: z.string(),
});

export type PromptParams = z.infer<typeof PromptParamsSchema>;
