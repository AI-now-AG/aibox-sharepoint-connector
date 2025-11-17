import { ObjectId } from "mongodb";
import { db, toObjectId, type Document } from "../mongodb";
import { z } from "zod";

export const GroupSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  title: z.string(),
  slug: z.string().optional(),
  active: z.boolean().default(true).optional(),
});

const CategorySchema = z.object({
  _id: z.instanceof(ObjectId),
  title: z.string(),
  slug: z.string(),
  icon: z.string().optional(),
  active: z.boolean().default(true).optional(),
  position: z.number().default(0).optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

const CategoryGroupSchema = CategorySchema.extend({
  groups: z.array(GroupSchema),
});

export type Category = z.infer<typeof CategoryGroupSchema>;
export type Group = z.infer<typeof GroupSchema>;

const collection = db.collection("global_categories");

export default {
  create: async (category: Partial<Omit<Category, "_id">>) => {
    const validated = CategoryGroupSchema.parse(category);
    const doc = {
      active: true,
      position: 0,
      ...validated,
    };
    return collection.insertOne(doc);
  },

  update: async (id: string | ObjectId, update: Partial<Category>) => {
    const _id = toObjectId(id);
    const validated = CategoryGroupSchema.partial().parse(update);
    const result = await collection.findOneAndUpdate(
      { _id },
      { $set: { ...validated } },
      { returnDocument: "after" },
    );
    return result;
  },

  remove: async (id: string | ObjectId) => {
    const _id = toObjectId(id);
    return collection.deleteOne({ _id });
  },

  list: async () => {
    return collection
      .find<Document<Category>>({})
      .sort({ position: 1, created_at: 1 })
      .toArray();
  },

  get: async (id: string | ObjectId): Promise<Category | null> => {
    const _id = toObjectId(id);
    const doc = await collection.findOne<Document<Category>>({ _id });
    if (!doc) return null;
    return doc;
  },

  getMaxPosition: async () => {
    return collection
      .find<Document<Category>>({})
      .sort({ position: -1 })
      .limit(1)
      .next();
  },
};
