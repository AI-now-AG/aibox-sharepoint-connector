import { db, type Document } from "../mongodb";
import { z } from "zod";

const CategorySchema = z.object({
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

  list: async () => collection.find<Document<Category>>({}),
};
