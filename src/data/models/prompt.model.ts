import { ObjectId } from "mongodb";
import { db, type Document } from "../mongodb";
import { z } from "zod";

const PromptSchema = z.object({
  tenant_id: z.instanceof(ObjectId).optional(),
  creator_id: z.instanceof(ObjectId).optional(),
  title: z.string(),
  description: z.string(),
  category: z.instanceof(ObjectId).optional(),
  group: z.instanceof(ObjectId).optional(),
  instructions: z.array(z.instanceof(ObjectId)).optional(),
  knowledgebase: z.array(z.instanceof(ObjectId)).optional(),
  prompt: z.string(),
  documents: z.array(z.instanceof(ObjectId)).optional(),
  position: z.number().default(0).optional(),
  created_at: z.date().optional(),
  updated_at: z.date(),
});

const convertObjectIdToString = (doc: Document<Prompt>) => {
  return {
    ...doc,
    _id: doc._id.toString(),
    tenant_id: doc.tenant_id?.toString(),
    creator_id: doc.creator_id?.toString(),
    category: doc.category?.toString(),
    group: doc.group?.toString(),
    instructions: doc.instructions?.map((id) => id.toString()),
    knowledgebase: doc.knowledgebase?.map((id) => id.toString()),
    documents: doc.documents?.map((id) => id.toString()),
  };
};

export type Prompt = z.infer<typeof PromptSchema>;

const collection = db.collection("prompts");

export default {
  add: async (prompt: Prompt) => {
    const validated = PromptSchema.parse(prompt);
    const doc = {
      ...{
        position: 0,
      },
      ...validated,
    };
    return collection.insertOne(doc);
  },

  remove: async (id: string) => {
    const _id = new ObjectId(id);
    return collection.deleteOne({ _id });
  },

  get: async (id: string) => {
    const _id = new ObjectId(id);
    return collection.findOne<Document<Prompt>>({ _id });
  },

  getAsString: async (id: string) => {
    const _id = new ObjectId(id);
    const doc = await collection.findOne<Document<Prompt>>({ _id });
    if (!doc) return null;
    return convertObjectIdToString(doc);
  },

  list: async () =>
    collection.find<Document<Prompt>>({}).sort({ created_at: 1 }),

  listByTenant: async (id: ObjectId) => {
    return collection
      .find<Document<Prompt>>({ tenant_id: id })
      .sort({ position: 1, created_at: 1 });
  },

  update: async (id: string, updatedPrompt: Partial<Prompt>) => {
    const _id = new ObjectId(id);
    const validated = PromptSchema.partial().parse(updatedPrompt);
    const result = await collection.updateOne(
      { _id },
      { $set: { ...validated } },
    );
    return result;
  },

  updatePromptField: async (id: string, newPrompt: string) => {
    const _id = new ObjectId(id);
    const result = await collection.updateOne(
      { _id },
      { $set: { prompt: newPrompt } },
    );
    return result;
  },
};
