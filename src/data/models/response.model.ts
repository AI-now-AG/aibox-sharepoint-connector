import { ObjectId } from "mongodb";
import { db, type Document } from "../mongodb";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

export const ErrorSchema = z.object({
  code: z.string().optional(),
  message: z.string().optional(),
});

const ToolOutputSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("image"),
    image_url: z.string().url(),
  }),
]);

const ResponseSchema = z.object({
  id: z.string().min(1),
  creator_id: z.instanceof(ObjectId).optional(),
  prompt: z.string().min(1),
  status: z.string(),
  output_text: z.string().nullish().default(null),
  tools: z.array(ToolOutputSchema).optional(),
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
  expires_at: z
    .date()
    .optional()
    .default(() => {
      const d = new Date();
      d.setHours(d.getHours() + 1);
      return d;
    }),
});

export type Response = z.infer<typeof ResponseSchema>;

const collection = db.collection("image_tasks");

export default {
  create: async (document: Partial<Response>) => {
    const validated = ResponseSchema.parse({ id: uuidv4(), ...document });
    return collection.insertOne(validated);
  },

  get: async (id: string): Promise<Response | null> => {
    return collection.findOne<Document<Response>>({ id });
  },

  update: async (id: string, update: Partial<Response>) => {
    const validated = ResponseSchema.partial().parse(update);
    const result = await collection.updateOne(
      { id },
      { $set: { ...validated } },
    );
    return result;
  },
};
