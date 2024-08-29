import { ObjectId } from "mongodb";
import { db, type Document } from "../mongodb";
import { z } from "zod";

const KnowledgeBaseSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  tenant_id: z.instanceof(ObjectId).optional(),
  creator_id: z.instanceof(ObjectId).optional(),
  title: z.string(),
  description: z.string(),
  knowledge_base: z.string(),
  created_at: z.date().optional(),
  updated_at: z.date(),
});

export type KnowledgeBase = z.infer<typeof KnowledgeBaseSchema>;

const collection = db.collection("knowlegebases");

export default {
  add: async (knowledgeBase: KnowledgeBase) => {
    const validated = KnowledgeBaseSchema.parse(knowledgeBase);
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

  list: async () =>
    collection.find<Document<KnowledgeBase>>({}).sort({ created_at: 1 }),

  listByUser: async (id: string) => {
    const _id = new ObjectId(id);
    return collection
      .find<Document<KnowledgeBase>>({ creator_id: _id })
      .sort({ created_at: 1 });
  },

  update: async (id: string, updatedKnowledgeBase: Partial<KnowledgeBase>) => {
    const _id = new ObjectId(id);
    const validated = KnowledgeBaseSchema.partial().parse(updatedKnowledgeBase);
    const result = await collection.updateOne(
      { _id },
      { $set: { ...validated } },
    );
    return result;
  },

  updateKnowledgeBase: async (id: string, newKnowledgeBase: string) => {
    const _id = new ObjectId(id);
    const result = await collection.updateOne(
      { _id },
      { $set: { knowledge_base: newKnowledgeBase } },
    );
    return result;
  },
};
