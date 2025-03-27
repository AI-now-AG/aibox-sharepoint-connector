import { ObjectId } from "mongodb";
import { db, type Document } from "../mongodb";
import { ApiKeyProvider } from "$types/TenantFeature";
import { UsageType } from "$types/UsageTracking";
import { z } from "zod";

const UsageSchema = z.object({
  _id: z.instanceof(ObjectId),
  tenant_id: z.instanceof(ObjectId).optional(),
  provider: z.nativeEnum(ApiKeyProvider),
  model: z.string().min(1),
  input_tokens: z.number().default(0),
  output_tokens: z.number().default(0),
  type: z.nativeEnum(UsageType),
  metadata: z.record(z.any()).nullish(),
  created_at: z
    .date()
    .optional()
    .default(() => new Date()),
  updated_at: z
    .date()
    .optional()
    .default(() => new Date()),
});
export type Usage = z.infer<typeof UsageSchema>;

const collection = db.collection("usages");

export default {
  create: async (tenant: Partial<Omit<Usage, "_id">>) => {
    const validated = UsageSchema.parse({ _id: new ObjectId(), ...tenant });
    return await collection.insertOne(validated);
  },

  update: async (id: string | ObjectId, update: Partial<Usage>) => {
    const objectId = id instanceof ObjectId ? id : new ObjectId(id);
    const validated = UsageSchema.partial().parse(update);
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

  listByTenant: async (tenantId: string) => {
    return collection.find<Document<Usage>>({ tenant_id: tenantId });
  },
};
