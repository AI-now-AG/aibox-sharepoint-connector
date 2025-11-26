import { ObjectId } from "mongodb";
import { db, toObjectId, type Document } from "../mongodb";
import { z } from "zod";

const TagSchema = z.object({
  _id: z.instanceof(ObjectId),
  title: z.string(),
  description: z.string().default(""),
  icon: z.string().nullish(),
  iconColor: z.string().nullish(),
  created_at: z
    .date()
    .optional()
    .default(() => new Date()),
  updated_at: z
    .date()
    .optional()
    .default(() => new Date()),
});

export type Tag = z.infer<typeof TagSchema>;

const collection = db.collection("global_tags");

export default {
  create: async (category: Partial<Omit<Tag, "_id">>) => {
    const validated = TagSchema.parse({
      _id: new ObjectId(),
      ...category,
    });
    const doc = {
      active: true,
      position: 0,
      ...validated,
    };
    return collection.insertOne(doc);
  },

  update: async (id: string | ObjectId, update: Partial<Tag>) => {
    const _id = toObjectId(id);
    const validated = TagSchema.partial().parse(update);
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

  list: async () => {
    return collection
      .find<Document<Tag>>({})
      .sort({ position: 1, created_at: 1 })
      .toArray();
  },

  get: async (id: string | ObjectId): Promise<Tag | null> => {
    const _id = toObjectId(id);
    const doc = await collection.findOne<Document<Tag>>({ _id });
    if (!doc) return null;
    return doc;
  },
};
