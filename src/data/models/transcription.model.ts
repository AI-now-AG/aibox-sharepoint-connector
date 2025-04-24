import { ObjectId } from "mongodb";
import { db, toObjectId, type Document } from "../mongodb";
import { z } from "zod";
import { AudioCategory } from "$types/TenantFeature";

export const TranscriptionSchema = z.object({
  _id: z.instanceof(ObjectId),
  tenant_id: z.instanceof(ObjectId),
  user_id: z.instanceof(ObjectId).optional(), // Optional: If user-specific
  name: z.string().min(1),
  category: z.nativeEnum(AudioCategory), // One of the categories
  enabled: z.boolean().default(true),
  text: z.string().optional(),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),
});

export type Transcription = z.infer<typeof TranscriptionSchema>;

const collection = db.collection("transcriptions");

export default {
  add: async (tenant: Partial<Omit<Transcription, "_id">>) => {
    const validated = TranscriptionSchema.parse({
      _id: new ObjectId(),
      ...tenant,
    });
    // const doc = {
    //   ...{
    //     included_features: [
    //       {
    //         name: TenantFeature.TextPrommpts,
    //         provider: ApiKeyProvider.OpenAI,
    //       },
    //     ],
    //   },
    //   ...validated,
    // };
    return await collection.insertOne(validated);
  },

  update: async (id: string | ObjectId, update: Partial<Transcription>) => {
    const objectId = toObjectId(id);
    const validated = TranscriptionSchema.partial().parse(update);
    const doc = {
      ...validated,
      updated_at: new Date(),
    };
    return await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: doc },
      {
        returnDocument: "after",
      },
    );
  },

  remove: async (id: string) => {
    const _id = new ObjectId(id);
    return collection.deleteOne({ _id });
  },

  updateActiveStatus: async (id: string, isActive: boolean) => {
    return await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { enabled: isActive, updated_at: new Date() } },
    );
  },

  updateActiveStatusByCategory: async (
    tenantId: string,
    category: AudioCategory,
    isActive: boolean,
  ) => {
    if (!ObjectId.isValid(tenantId)) {
      return null;
    }
    const _id = new ObjectId(tenantId);
    return await collection.updateMany(
      { tenant_id: _id, category: category },
      { $set: { enabled: isActive, updated_at: new Date() } },
    );
  },

  listByTenant: async (tenantId: string | ObjectId) => {
    if (!ObjectId.isValid(tenantId)) {
      return [];
    }
    const _tenantId = toObjectId(tenantId);
    const data = collection.find<Document<Transcription>>({
      tenant_id: _tenantId,
    });
    return await data.toArray();
  },

  get: async (id: string): Promise<Transcription | null> => {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    const _id = new ObjectId(id);
    return collection.findOne<Document<Transcription>>({ _id });
  },

  insertMultiple: async (docs: Transcription[]) => {
    // Validate and map all docs
    const validatedDocs = docs.map((doc) => {
      const validated = TranscriptionSchema.parse(doc);
      return {
        position: 0,
        ...validated,
      };
    });

    // Insert all at once
    return collection.insertMany(validatedDocs);
  },
};
