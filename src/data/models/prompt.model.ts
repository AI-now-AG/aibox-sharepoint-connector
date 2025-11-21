import { ObjectId } from "mongodb";
import { db, toObjectId, type Document } from "../mongodb";
import { z } from "zod";
import { ReasoningEffortOption } from "$types/AIProvider";

const PromptSchema = z.object({
  tenant_id: z.instanceof(ObjectId).optional(),
  creator_id: z.instanceof(ObjectId).optional(),
  title: z.string(),
  description: z.string(),
  category: z.instanceof(ObjectId).optional(),
  group: z.instanceof(ObjectId).optional(),
  knowledgebase: z.array(z.instanceof(ObjectId)).optional(),
  prompt: z.string(),
  predefined_input: z.string().optional(),
  model: z.string().nullish(),
  reasoningEffort: z.string().nullish().default(ReasoningEffortOption.None),
  textVerbosity: z.string().nullish(),
  promptTool: z.string().nullish(),
  documents: z.array(z.instanceof(ObjectId)).optional(),
  position: z.number().default(0).optional(),
  created_at: z.date().optional(),
  updated_at: z.date(),
});

export type Prompt = z.infer<typeof PromptSchema>;

const collection = db.collection("prompts");

export default {
  add: async (prompt: Prompt) => {
    const validated = PromptSchema.parse(prompt);
    const doc = {
      position: 0,
      ...validated,
    };
    return collection.insertOne(doc);
  },

  insertMultiple: async (docs: Prompt[]) => {
    // Validate and map all docs
    const validatedDocs = docs.map((doc) => {
      const validated = PromptSchema.parse(doc);
      return {
        position: 0,
        ...validated,
      };
    });

    // Insert all at once
    return collection.insertMany(validatedDocs);
  },

  update: async (id: string, updatedPrompt: Partial<Prompt>) => {
    const _id = new ObjectId(id);
    const validated = PromptSchema.partial().parse(updatedPrompt);
    const result = await collection.findOneAndUpdate(
      { _id },
      { $set: { ...validated } },
      { returnDocument: "after" },
    );
    return result;
  },

  remove: async (id: string) => {
    const _id = new ObjectId(id);
    return collection.deleteOne({ _id });
  },

  removeByTenant: async (tenantId: string | ObjectId) => {
    const objectId = toObjectId(tenantId);
    return collection.deleteMany({ tenant_id: objectId });
  },

  get: async (id: string | ObjectId): Promise<Prompt | null> => {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    const _id = toObjectId(id);
    return collection.findOne<Document<Prompt>>({ _id });
  },

  list: async () => {
    return collection
      .find<Document<Prompt>>({})
      .sort({ created_at: 1 })
      .toArray();
  },

  listByTenant: async (id: ObjectId) => {
    return collection
      .find<Document<Prompt>>({ tenant_id: id })
      .sort({ position: 1, created_at: 1 })
      .toArray();
  },

  listByCategory: async (categoryId: string | ObjectId) => {
    const _categoryId = toObjectId(categoryId);
    return collection
      .find<Document<Prompt>>({
        category: _categoryId,
      })
      .sort({ position: 1, created_at: 1 })
      .toArray();
  },

  listForExportByTenant: async (tenantId: ObjectId) => {
    // Execute the aggregation
    return collection
      .aggregate([
        {
          $match: {
            tenant_id: tenantId,
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $lookup: {
            from: "knowlegebases",
            localField: "knowledgebase",
            foreignField: "_id",
            as: "knowledgebase",
          },
        },
        {
          $unwind: "$category",
        },
      ])
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
