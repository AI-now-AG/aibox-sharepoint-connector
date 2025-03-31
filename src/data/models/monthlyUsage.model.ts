import { ObjectId } from "mongodb";
import { db, type Document } from "../mongodb";
import { UsageService } from "$types/UsageTracking";
import { MONTHLY_USAGES } from "$constants";
import { z } from "zod";

export const ServiceSchema = z.object({
  text: z
    .object({
      limitTokens: z.number().default(0),
      extraAmount: z.number().default(0),
      usedTokens: z.number().default(0),
    })
    .optional(),

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

  transcription: z
    .object({
      limitSeconds: z.number().default(0),
      extraAmount: z.number().default(0),
      usedSeconds: z.number().default(0),
    })
    .optional(),
});
type Service = z.infer<typeof ServiceSchema>;

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

const getCurrentMonthFormatted = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  return `${year}-${month}`;
};

export const createDefaultMonthlyUsage = async (tenantId: ObjectId) => {
  const month = getCurrentMonthFormatted();

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
        limitRequests: MONTHLY_USAGES.IMAGE_FLUX_LIMIT_REQUEST,
        extraAmount: 0,
        usedRequests: 0,
      },
      [UsageService.ImageFlux]: {
        limitRequests: MONTHLY_USAGES.IMAGE_FLUX_LIMIT_REQUEST,
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
  const result = await collection.insertOne(validated);

  return { ...validated, _id: result.insertedId } as MonthlyUsage;
};

export const getDefaultUsageSettings = () => {
  return {
    [UsageService.Text]: {
      limitTokens: 0,
      extraAmount: 0,
      usedTokens: 0,
    },
    [UsageService.ImageDalle]: {
      limitRequests: MONTHLY_USAGES.IMAGE_DALLE_LIMIT_REQUEST,
      extraAmount: 0,
      usedRequests: 0,
    },
    [UsageService.ImageFlux]: {
      limitRequests: MONTHLY_USAGES.IMAGE_FLUX_LIMIT_REQUEST,
      extraAmount: 0,
      usedRequests: 0,
    },
    [UsageService.Transcription]: {
      limitSeconds: 0,
      extraAmount: 0,
      usedSeconds: 0,
    },
  };
};

export default {
  findOrCreateMonthlyUsage: async (tenantId: ObjectId | string) => {
    const _tenantId =
      tenantId instanceof ObjectId ? tenantId : new ObjectId(tenantId);
    const doc = await collection.findOne<Document<MonthlyUsage>>({
      tenant_id: _tenantId,
      month: getCurrentMonthFormatted(),
    });

    if (!doc) {
      return await createDefaultMonthlyUsage(_tenantId);
    }

    return doc;
  },
  upsertAndIncrementUsageMetrics: async ({
    tenantId,
    month = getCurrentMonthFormatted(),
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
      await createDefaultMonthlyUsage(tenantId);
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
  createMonthlyUsage: async (
    tenantId: ObjectId | string,
    services: Service,
  ) => {
    const _tenantId =
      tenantId instanceof ObjectId ? tenantId : new ObjectId(tenantId);
    const month = getCurrentMonthFormatted();

    await createDefaultMonthlyUsage(_tenantId);

    const doc = {
      services,
      updated_at: new Date(),
    };
    return await collection.findOneAndUpdate(
      { tenant_id: _tenantId, month },
      { $set: doc },
      {
        returnDocument: "after",
      },
    );
  },
  updateMonthlyUsage: async (
    tenantId: ObjectId | string,
    services: Service,
  ) => {
    const _tenantId =
      tenantId instanceof ObjectId ? tenantId : new ObjectId(tenantId);
    const month = getCurrentMonthFormatted();

    const doc = {
      services,
      updated_at: new Date(),
    };
    return await collection.findOneAndUpdate(
      { tenant_id: _tenantId, month },
      { $set: doc },
      {
        returnDocument: "after",
      },
    );
  },
};
