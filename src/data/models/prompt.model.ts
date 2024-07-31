import { ObjectId } from "mongodb";
import { db } from "../mongodb";
import { z } from "zod";

const PromptSchema = z.object({
  _id: z.instanceof(ObjectId),
  tenant_id: z.instanceof(ObjectId),
  creator_id: z.instanceof(ObjectId),
  parent_id: z.instanceof(ObjectId).optional(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  instructions: z.array(z.string()),
  documents: z.array(z.instanceof(ObjectId)),
  created_at: z.date(),
  updated_at: z.date(),
});

export type Prompt = z.infer<typeof PromptSchema>;

const collection = db.collection("prompts");

export default {
  add: async (prompt: Prompt) => {
    const validated = PromptSchema.parse(prompt);
    return collection.insertOne(validated);
  },

  list: async () => collection.find<Prompt>({}),
};
