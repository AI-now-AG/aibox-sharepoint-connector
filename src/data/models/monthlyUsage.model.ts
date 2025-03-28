import { ObjectId } from "mongodb";
import { db, type Document } from "../mongodb";
import { UsageService } from "$types/UsageTracking";
import { z } from "zod";

export const ServiceSchema = z.object({
  text: z.object({
    limitTokens: z.number().default(0),
    extraAmount: z.number().default(0),
    usedTokens: z.number().default(0),
  }),

  imageDalle: z.object({
    limitRequests: z.number().default(0),
    extraAmount: z.number().default(0),
    usedRequests: z.number().default(0),
  }),

  imageFlux: z.object({
    limitRequests: z.number().default(0),
    extraAmount: z.number().default(0),
    usedRequests: z.number().default(0),
  }),

  transcription: z.object({
    limitSeconds: z.number().default(0),
    extraAmount: z.number().default(0),
    usedSeconds: z.number().default(0),
  }),
});

const MonthlyUsageSchema = z.object({
  _id: z.instanceof(ObjectId),
  tenant_id: z.instanceof(ObjectId).optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Invalid YYYY-MM format"),
  services: ServiceSchema,
  created_at: z
    .date()
    .optional()
    .default(() => new Date()),
  updated_at: z
    .date()
    .optional()
    .default(() => new Date()),
});
export type MonthlyUsage = z.infer<typeof MonthlyUsageSchema>;

const collection = db.collection("monthly_usages");

const getCurrentMonth = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  return `${year}-${month}`;
};

export default {
  upsertAndIncrementUsage: async ({
    tenantId,
    month = getCurrentMonth(),
    service,
    usage,
  }: {
    tenantId: ObjectId;
    month?: string;
    service: UsageService;
    usage: {
      tokens?: number;
      seconds?: number;
      requests?: number;
    };
  }) => {
    const filter = { tenant_id: tenantId, month };

    // Try to find existing doc
    const existing = await collection.findOne(filter);

    if (!existing) {
      // Create a new usage doc with default limits
      const newDoc: Partial<MonthlyUsage> = {
        _id: new ObjectId(),
        tenant_id: tenantId,
        month,
        services: {
          [UsageService.Text]: {
            limitTokens: 0,
            extraAmount: 0,
            usedTokens: 0,
          },
          [UsageService.ImageDalle]: {
            limitRequests: 0,
            extraAmount: 0,
            usedRequests: 0,
          },
          [UsageService.ImageFlux]: {
            limitRequests: 0,
            extraAmount: 0,
            usedRequests: 0,
          },
          [UsageService.Transcription]: {
            limitSeconds: 0,
            extraAmount: 0,
            usedSeconds: 0,
          },
        },
      };

      const validated = MonthlyUsageSchema.parse(newDoc);
      await collection.insertOne(validated);
    }

    // Prepare update object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: any = {
      $set: {
        updated_at: new Date(),
      },
      $inc: {},
    };

    if (service === UsageService.Text && usage.tokens) {
      update.$inc["services.text.usedTokens"] = usage.tokens;
    }

    if (service === UsageService.ImageDalle && usage.requests) {
      update.$inc["services.imageDalle.usedRequests"] = usage.requests;
    }

    if (service === UsageService.ImageFlux && usage.requests) {
      update.$inc["services.imageFlux.usedRequests"] = usage.requests;
    }

    if (service === UsageService.Transcription && usage.seconds) {
      update.$inc["services.transcription.usedSeconds"] = usage.seconds;
    }

    const result = await collection.findOneAndUpdate(filter, update, {
      returnDocument: "after",
    });

    return result;
  },
};
