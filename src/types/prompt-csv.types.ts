import { z } from "zod";

const CsvRowRawSchema = z.object({
  title: z.string(),
  description: z.string(),
  prompt: z.string(),
  category: z.string().optional(),
  group: z.string().optional(),
  knowledgebase: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

const CsvRowParsedSchema = CsvRowRawSchema.extend({
  knowledgebase: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      knowledge_base: z.string(),
    }),
  ),
});

export type CsvRowRaw = z.infer<typeof CsvRowRawSchema>;
export type CsvRowParsed = z.infer<typeof CsvRowParsedSchema>;
