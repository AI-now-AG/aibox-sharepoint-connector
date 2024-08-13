import { ObjectId } from "mongodb";
import { db, type Document } from "../mongodb";
import { z } from "zod";

export const GroupSchema = z.object({
  _id: z.instanceof(ObjectId),
  title: z.string(),
  slug: z.string(),
});

const CategorySchema = z.object({
  tenant_id: z.instanceof(ObjectId),
  creator_id: z.instanceof(ObjectId),
  title: z.string(),
  slug: z.string(),
  icon: z.string().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

const CategoryGroupSchema = CategorySchema.extend({
  groups: z.array(GroupSchema),
});

export type Category = z.infer<typeof CategoryGroupSchema>;
export type Group = z.infer<typeof GroupSchema>;

const collection = db.collection("categories");

export default {
  add: async (category: Category) => {
    const validated = CategoryGroupSchema.parse(category);

    return collection.insertOne(validated);
  },

  remove: async (id: string) => {
    const _id = new ObjectId(id);
    return collection.deleteOne({ _id });
  },

  upsert: async (category: Category) => {
    const validated = CategoryGroupSchema.parse(category);

    return collection.updateOne(
      { title: validated.title },
      { $set: validated },
      {
        upsert: true,
      },
    );
  },

  list: async () => collection.find<Document<Category>>({}).sort({created_at: 1}).sort({created_at: 1}),

  listByUser: async (id: string) => {
    const _id = new ObjectId(id);
    return collection.find<Document<Category>>({ creator_id: _id }).sort({created_at: 1})
  },

  get: async (id: string) => {
    const _id = new ObjectId(id);
    return collection.findOne<Document<Category>>({ _id });
  },

  getByTitle: async (title: string) => {
    return collection.findOne<Document<Category>>({ title });
  },

  getBySlug: async (slug: string) => {
    return collection.findOne<Document<Category>>({ slug });
  },
};
