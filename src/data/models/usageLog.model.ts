import { ObjectId } from "mongodb";
import { db, toObjectId, type Document } from "../mongodb";
import { ApiKeyProvider, AudioCategory } from "$types/TenantFeature";
import { UsageType } from "$types/UsageTracking";
import { z } from "zod";

const UsageLogSchema = z.object({
  _id: z.instanceof(ObjectId),
  tenant_id: z.instanceof(ObjectId).optional(),
  provider: z.nativeEnum(ApiKeyProvider).optional(),
  category: z.nativeEnum(AudioCategory).optional(),
  model: z.string().min(1),
  input_tokens: z.number().default(0).optional(),
  output_tokens: z.number().default(0).optional(),
  duration: z.number().optional(),
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

const getMonthRange = (month: string): { start: Date; end: Date } => {
  const [mm, yyyy] = month.split("-");
  const start = new Date(Number(yyyy), Number(mm) - 1, 1); // Start of the month
  const end = new Date(Number(yyyy), Number(mm), 1); // Start of the next month
  return { start, end };
};

export default {
  create: async (tenant: Partial<UsageLog>) => {
    const validated = UsageLogSchema.parse({ _id: new ObjectId(), ...tenant });
    return await collection.insertOne(validated);
  },

  update: async (id: string | ObjectId, update: Partial<UsageLog>) => {
    const objectId = toObjectId(id);
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

  listUsageSummary: async (tenantId: string, month: string) => {
    // Get date range for the month
    const { start, end } = getMonthRange(month);

    return collection.find<Document<UsageLog>>({
      tenant_id: new ObjectId(tenantId), // Filter by tenant ID
      created_at: { $gte: start, $lt: end }, // Filter by date range for the month
    });
  },
};
