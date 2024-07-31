import { ObjectId } from "mongodb";
import { db } from "../mongodb";
import { z } from "zod";

const CategorySchema = z.object({
  _id: z.instanceof(ObjectId),
  title: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
});

export type Category = z.infer<typeof CategorySchema>;

const collection = db.collection("categories");

export default {
  add: async (category: Category) => {
    const validated = CategorySchema.parse(category);
    return collection.insertOne(validated);
  },

  all: async () => collection.find<Category>({}),
};
