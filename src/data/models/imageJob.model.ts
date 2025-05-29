import { ObjectId } from "mongodb";
import { db, toObjectId, type Document } from "../mongodb";
import { z } from "zod";

export const ErrorSchema = z.object({
  code: z.string().optional(),
  message: z.string().optional(),
});

const ImageJobSchema = z.object({
  _id: z.instanceof(ObjectId),
  job_id: z.string().min(1),
  creator_id: z.instanceof(ObjectId).optional(),
  prompt: z.string().min(1),
  status: z.string(),
  imageUrl: z.string().nullish().default(null),
  model: z.string().nullish(),
  size: z.string().nullish(),
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

export type ImageJob = z.infer<typeof ImageJobSchema>;

const collection = db.collection("image_jobs");

export default {
  create: async (prompt: Partial<ImageJob>) => {
    const validated = ImageJobSchema.parse({ _id: new ObjectId(), ...prompt });
    const doc = {
      ...validated,
    };
    return collection.insertOne(doc);
  },

  get: async (id: string): Promise<ImageJob | null> => {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    const _id = new ObjectId(id);
    return collection.findOne<Document<ImageJob>>({ _id });
  },

  getByJobId: async (jobId: string): Promise<ImageJob | null> => {
    return collection.findOne<Document<ImageJob>>({ job_id: jobId });
  },

  update: async (id: string | ObjectId, update: Partial<ImageJob>) => {
    const _id = toObjectId(id);
    const validated = ImageJobSchema.partial().parse(update);
    const result = await collection.updateOne(
      { _id },
      { $set: { ...validated } },
    );
    return result;
  },
};
