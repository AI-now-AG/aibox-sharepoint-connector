import { ObjectId } from "mongodb";
import { db, type Document } from "../mongodb";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

export const ErrorSchema = z.object({
  code: z.string().optional(),
  message: z.string().optional(),
});

const ImageTaskSchema = z.object({
  id: z.string().min(1),
  creator_id: z.instanceof(ObjectId).optional(),
  prompt: z.string().min(1),
  status: z.string(),
  image_url: z.string().nullish().default(null),
  model: z.string().nullish().default(null),
  size: z.string().nullish().default(null),
  response_id: z.string().nullish().default(null),
  error: ErrorSchema.optional(),
  created_at: z
    .date()
    .optional()
    .default(() => new Date()),
  updated_at: z
    .date()
    .optional()
    .default(() => new Date()),
});

export type ImageTask = z.infer<typeof ImageTaskSchema>;

const collection = db.collection("image_tasks");

export default {
  create: async (document: Partial<ImageTask>) => {
    const validated = ImageTaskSchema.parse({ id: uuidv4(), ...document });
    return collection.insertOne(validated);
  },

  get: async (id: string): Promise<ImageTask | null> => {
    return collection.findOne<Document<ImageTask>>({ id });
  },

  update: async (id: string, update: Partial<ImageTask>) => {
    const validated = ImageTaskSchema.partial().parse(update);
    const result = await collection.updateOne(
      { id },
      { $set: { ...validated } },
    );
    return result;
  },
};
