import { ObjectId } from "mongodb";
import { db, toObjectId, type Document } from "../mongodb";
import { z } from "zod";

const PromptSchema = z.object({
  _id: z.instanceof(ObjectId),
  title: z.string(),
  description: z.string(),
  category: z.instanceof(ObjectId).optional(),
  group: z.instanceof(ObjectId).optional(),
  knowledgebase: z.array(z.instanceof(ObjectId)).optional(),
  prompt: z.string(),
  predefined_input: z.string().optional(),
  model: z.string().nullish(),
  reasoningEffort: z.string().nullish(),
  textVerbosity: z.string().nullish(),
  promptTool: z.string().nullish(),
  documents: z.array(z.instanceof(ObjectId)).optional(),
  position: z.number().default(0).optional(),
  created_at: z
    .date()
    .optional()
    .default(() => new Date()),
  updated_at: z
    .date()
    .optional()
    .default(() => new Date()),
});

export type Prompt = z.infer<typeof PromptSchema>;

const collection = db.collection("global_prompts");

export default {
  create: async (prompt: Partial<Omit<Prompt, "_id">>) => {
    const validated = PromptSchema.parse({ _id: new ObjectId(), ...prompt });
    const doc = {
      position: 0,
      ...validated,
    };
    return collection.insertOne(doc);
  },

  update: async (id: string | ObjectId, update: Partial<Prompt>) => {
    const _id = toObjectId(id);
    const validated = PromptSchema.partial().parse(update);
    const doc = {
      ...validated,
      updated_at: new Date(),
    };

    const result = await collection.findOneAndUpdate(
      { _id },
      { $set: doc },
      { returnDocument: "after" },
    );
    return result;
  },

  remove: async (id: string | ObjectId) => {
    const _id = toObjectId(id);
    return collection.deleteOne({ _id });
  },

  get: async (id: string | ObjectId): Promise<Prompt | null> => {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    const _id = toObjectId(id);
    return collection.findOne<Document<Prompt>>({ _id });
  },

  list: async () =>
    collection.find<Document<Prompt>>({}).sort({ created_at: 1 }).toArray(),

  listByCategoryIds: async (categoryIds: ObjectId[]) => {
    return collection
      .find<Document<Prompt>>({
        category: { $in: categoryIds },
      })
      .toArray();
  },

  getMaxPosition: async (groupId: ObjectId) => {
    return collection
      .find<Document<Prompt>>({ group: groupId })
      .sort({ position: -1 })
      .limit(1)
      .next();
  },
};
