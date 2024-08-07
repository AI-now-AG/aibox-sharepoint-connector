import { ObjectId } from "mongodb";
import { db, type Document } from "../mongodb";
import { z } from "zod";

const KnowledgeBaseSchema = z.object({
  tenant_id: z.instanceof(ObjectId),
  creator_id: z.instanceof(ObjectId),
  title: z.string(),
  description: z.string(),
  knowledge_base: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
});

export type KnowledgeBase = z.infer<typeof KnowledgeBaseSchema>;

const collection = db.collection("knowlegebases");

export default {
  add: async (prompt: KnowledgeBase) => {
    const validated = KnowledgeBaseSchema.parse(prompt);
    return collection.insertOne(validated);
  },

  remove: async (id: string) => {
    const _id = new ObjectId(id);
    return collection.deleteOne({ _id });
  },

  get: async (id: string) => {
    const _id = new ObjectId(id);
    return collection.findOne<Document<KnowledgeBase>>({ _id });
  },

  list: async () => collection.find<Document<KnowledgeBase>>({}),
};
