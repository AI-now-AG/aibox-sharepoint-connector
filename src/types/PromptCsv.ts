import { z } from "zod";

export enum CsvColumn {
  Title = "title",
  Description = "description",
  Instruction = "instruction",
  Category = "category",
  Group = "group",
  Model = "model",
  PredefinedInput = "predefined_input",
  PromptTool = "prompt_tool",
  ReasoningEffort = "reasoning_effort",
  TextVerbosity = "text_verbosity",
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CsvRowRawSchema = z.object({
  title: z.string(),
  description: z.string(),
  instruction: z.string(),
  category: z.string().optional(),
  group: z.string().optional(),
  model: z.string().optional(),
  predefined_input: z.string().optional(),
  prompt_tool: z.string().optional(),
  reasoning_effort: z.string().optional(),
  text_verbosity: z.string().optional(),
});

export type CsvRowRaw = z.infer<typeof CsvRowRawSchema>;
