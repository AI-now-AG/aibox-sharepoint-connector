import { ObjectId } from "mongodb";
import { db, type Document } from "../mongodb";
import { z } from "zod";

const PromptSchema = z.object({
  tenant_id: z.instanceof(ObjectId),
  creator_id: z.instanceof(ObjectId),
  parent_id: z.instanceof(ObjectId).optional(),
  title: z.string(),
  description: z.string(),
  category: z.instanceof(ObjectId),
  group: z.instanceof(ObjectId),
  instructions: z.string().optional(),
  prompt: z.string(),
  documents: z.array(z.instanceof(ObjectId)).optional(),
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

  get: async (id: string) => {
    const _id = new ObjectId(id);
    return collection.findOne<Document<Prompt>>({ _id });
  },

  list: async () => collection.find<Document<Prompt>>({}),
};
