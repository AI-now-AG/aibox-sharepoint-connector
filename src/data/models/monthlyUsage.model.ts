import { ObjectId } from "mongodb";
import { db, type Document } from "../mongodb";
import { UsageType } from "$types/UsageTracking";
import { z } from "zod";

export const TopUpSchema = z.object({
  type: z.enum(["text", "imageDalle", "imageFlux", "audio"]),
  amount: z.number(),
  unit: z.enum(["tokens", "seconds"]),
  reason: z.string().optional(),
  addedBy: z.instanceof(ObjectId).optional(),
  date: z.date(),
});

export const ServiceSchema = z.object({
  text: z.object({
    limitTokens: z.number().default(0),
    usedTokens: z.number().default(0),
  }),

  imageDalle: z.object({
    limitRequests: z.number().default(0),
    usedRequests: z.number().default(0),
  }),

  imageFlux: z.object({
    limitRequests: z.number().default(0),
    usedRequests: z.number().default(0),
  }),

  audio: z.object({
    limitSeconds: z.number().default(0),
    usedSeconds: z.number().default(0),
  }),
});

const MonthlyUsageSchema = z.object({
  _id: z.instanceof(ObjectId),
  tenant_id: z.instanceof(ObjectId).optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Invalid YYYY-MM format"),
  services: ServiceSchema,
  topUps: z.array(TopUpSchema).default([]),
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
    service: "text" | "imageDalle" | "imageFlux" | "audio";
    usage: {
      tokens?: number;
      seconds?: number;
      requests?: number;
    };
  }): Promise<MonthlyUsage> => {
    const filter = { tenant_id: tenantId, month };

    // Try to find existing doc
    let existing = await collection.findOne(filter);

    if (!existing) {
      // Create a new usage doc with default limits
      const newDoc: MonthlyUsage = {
        _id: new ObjectId(),
        tenant_id: tenantId,
        month,
        services: {
          text: {
            limitTokens: 0,
            usedTokens: 0,
          },
          imageDalle: {
            limitRequests: 0,
            usedRequests: 0,
          },
          imageFlux: {
            limitRequests: 0,
            usedRequests: 0,
          },
          audio: {
            limitSeconds: 0,
            usedSeconds: 0,
          },
        },
        topUps: [],
        created_at: new Date(),
        updated_at: new Date(),
      };

      await collection.insertOne(newDoc);
      existing = newDoc;
    }

    // Prepare update object
    const update: any = {
      $set: {
        updated_at: new Date(),
      },
      $inc: {},
    };

    if (service === "text" && usage.tokens) {
      update.$inc["services.text.usedTokens"] = usage.tokens;
    }

    if (service === "imageDalle" && usage.requests) {
      update.$inc["services.imageDalle.usedRequests"] = usage.requests;
    }

    if (service === "imageFlux" && usage.requests) {
      update.$inc["services.imageFlux.usedRequests"] = usage.requests;
    }

    if (service === "audio" && usage.seconds) {
      update.$inc["services.audio.usedSeconds"] = usage.seconds;
    }

    const result = await collection.findOneAndUpdate(filter, update, {
      returnDocument: "after",
    });

    return result.value as MonthlyUsage;
  },
};
