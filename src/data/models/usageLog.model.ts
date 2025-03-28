import { ObjectId } from "mongodb";
import { db, type Document } from "../mongodb";
import { ApiKeyProvider } from "$types/TenantFeature";
import { UsageType } from "$types/UsageTracking";
import { z } from "zod";

const UsageLogSchema = z.object({
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
export type UsageLog = z.infer<typeof UsageLogSchema>;

const collection = db.collection("usage_logs");

export default {
  create: async (tenant: Partial<Omit<UsageLog, "_id">>) => {
    const validated = UsageLogSchema.parse({ _id: new ObjectId(), ...tenant });
    return await collection.insertOne(validated);
  },

  update: async (id: string | ObjectId, update: Partial<UsageLog>) => {
    const objectId = id instanceof ObjectId ? id : new ObjectId(id);
    const validated = UsageLogSchema.partial().parse(update);
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
    return collection.find<Document<UsageLog>>({ tenant_id: tenantId });
  },

  listUsageSummary: async () => {
    // Execute the aggregation
    return collection.aggregate([
      {
        $group: {
          _id: {
            tenant_id: "$tenant_id",
            provider: "$provider",
            model: "$model",
            type: "$type",
          },
          total_input: { $sum: "$input_tokens" },
          total_output: { $sum: "$output_tokens" },
        },
      },
    ]);
  },

  countDocuments: async (query: {
    tenant_id: string;
    provider: string;
    model: string;
    type: string;
    dateRange?: { start: Date; end: Date };
  }): Promise<number> => {
    const { tenant_id, provider, model, type, dateRange } = query;

    // Construct the MongoDB query
    const mongoQuery: any = {
      tenant_id: new ObjectId(tenant_id), // Convert tenant_id to ObjectId
      provider,
      model,
      type,
    };

    // Add date range filter if provided
    if (dateRange) {
      mongoQuery.created_at = {
        $gte: dateRange.start,
        $lte: dateRange.end,
      };
    }

    // Count the matching documents
    return await collection.countDocuments(mongoQuery);
  },
};
