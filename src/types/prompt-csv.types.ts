import { z } from "zod";

const CsvRowRawSchema = z.object({
  title: z.string(),
  description: z.string(),
  instruction: z.string(),
  category: z.string().optional(),
  group: z.string().optional(),
});

export type CsvRowRaw = z.infer<typeof CsvRowRawSchema>;
