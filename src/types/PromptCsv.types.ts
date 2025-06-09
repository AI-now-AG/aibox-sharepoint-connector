import { z } from "zod";

export enum CsvColumn {
  Title = "title",
  Description = "description",
  Instruction = "instruction",
  Category = "category",
  Group = "group",
  Model = "model",
  PredefinedInput = "predefined_input",
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CsvRowRawSchema = z.object({
  title: z.string(),
  description: z.string(),
  instruction: z.string(),
  category: z.string().optional(),
  group: z.string().optional(),
});

export type CsvRowRaw = z.infer<typeof CsvRowRawSchema>;
