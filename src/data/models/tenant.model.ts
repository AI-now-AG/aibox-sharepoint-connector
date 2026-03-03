/* eslint-disable @typescript-eslint/no-explicit-any */
import { ObjectId } from "mongodb";
import { db, toObjectId, type Document } from "../mongodb";
import { z } from "zod";
import {
  TenantFeature,
  ApiKeyProvider,
  AudioCategory,
  ThemeCode,
} from "$types/TenantFeature";
import { BillingMethod } from "$types/Subscription";
import { FlagStatus } from "$types/TenantMgnt";
import {
  ModelName,
  ReasoningEffortOption,
  EmbeddingProvider,
} from "$types/AIProvider";
import { ChunkingStrategy } from "$types/VectorKB";

export const TenantFilterParamsSchema = z.object({
  page: z.number().default(1),
  pageSize: z.number().default(20),
  searchValue: z.string().nullish(),
  statusFlags: z.array(z.string()),
  resellerCode: z.string().nullish(),
});
export type TenantFilterParams = z.infer<typeof TenantFilterParamsSchema>;

export const IncludedFeaturesSchema = z.object({
  name: z.nativeEnum(TenantFeature),
  provider: z.nativeEnum(ApiKeyProvider),
});

export const TextFeatureSchema = z.object({
  name: z.nativeEnum(ApiKeyProvider),
  active: z.boolean().default(false),
  default: z.boolean().default(false),
});

export const BillingInfoSchema = z.object({
  company_name: z.string().optional(),
  address: z.string().optional(),
  zip_code: z.string().optional(),
  location: z.string().optional(),
  country: z.string().optional(),
  email: z.string().optional(),
});

const TenantSchema = z.object({
  _id: z.instanceof(ObjectId),
  name: z.string().min(1),
  org_name: z.string().min(1),
  org_id: z.string(),
  default_language: z.string().nullish().default("en"),
  theme: z.nativeEnum(ThemeCode).default(ThemeCode.AIBox),
  primary_color: z.string().nullish(),
  api_key_providers: z.array(TextFeatureSchema).optional(),
  openai_chat_model: z.string().nullish().default(ModelName.Gpt4o),
  openai_api_key: z.string().nullish().default(null),
  openai_gpt5_chat_model: z.string().optional().default(ModelName.Gpt5),
  openai_gpt5_api_key: z.string().optional(),
  openai_gpt5_reasoning_effort: z
    .string()
    .optional()
    .default(ReasoningEffortOption.None),
  azure_openai_api_key: z.string().nullish().default(null),
  azure_openai_endpoint: z.string().nullish().default(null),
  azure_openai_instance_name: z.string().nullish().default(null),
  azure_openai_whisper_model: z.string().nullish().default(null),
  azure_openai_chat_model: z.string().nullish().default(null),
  included_features: z.array(IncludedFeaturesSchema).optional(),
  transcription_types: z.array(z.nativeEnum(AudioCategory)).optional(),
  // subtitle_editor: z.boolean().optional().default(false), // Deprecated: Subtitle Editor is now always active when Subtitle Studio is active
  audio_assistant_active: z.boolean().optional().default(true),
  subtitle_studio_active: z.boolean().optional().default(true),
  speech_api_key: z.string().nullish(),
  elevenLabs_api_key: z.string().optional(),
  speech_region: z.string().nullish(),
  perplexity_api_key: z.string().nullish(),
  perplexity_chat_model: z.string().nullish(),
  fal_ai_api_key: z.string().nullish(),
  anthropic_api_key: z.string().nullish(),
  anthropic_chat_model: z.string().nullish(),
  gemini_api_key: z.string().nullish(),
  gemini_chat_model: z.string().nullish(),
  active: z.boolean().optional().default(true),
  is_restrict_user_managment: z.boolean().optional().default(false),
  is_trial: z.boolean().optional().default(false),
  is_on_posthog: z.boolean().optional().default(false),
  is_internal: z.boolean().optional().default(false),
  is_reseller: z.boolean().optional().default(false),
  reseller_code: z.string().nullish(),
  owned_by_reseller: z.string().nullish(),
  comment: z.string().optional(),
  metadata: z.record(z.any()).nullish(),
  billing_method: z
    .nativeEnum(BillingMethod)
    .default(BillingMethod.MonthlyInvoice),
  billing_info: BillingInfoSchema.optional(),
  stripe_customer_id: z.string().nullish().default(null),
  totalPrice: z.string().nullish().default(null),
  extra_user_limit: z.number().nullish().default(0),
  included_user_limit: z.number().nullish().default(0),
  // Vector KB Configuration
  vector_kb_enabled: z.boolean().optional().default(false),
  vector_kb_embedding_provider: z.nativeEnum(EmbeddingProvider).nullish(),
  vector_kb_embedding_model: z.string().nullish(),
  vector_kb_chunk_size: z.number().optional().default(800),
  vector_kb_chunk_overlap: z.number().optional().default(200),
  vector_kb_max_storage_mb: z.number().optional().default(500),
  vector_kb_chunking_strategy: z
    .nativeEnum(ChunkingStrategy)
    .optional()
    .default(ChunkingStrategy.Fixed),
  vector_kb_debug_enabled: z.boolean().optional().default(false),
  created_at: z
    .date()
    .optional()
    .default(() => new Date()),
  updated_at: z
    .date()
    .optional()
    .default(() => new Date()),
});
export type Tenant = z.infer<typeof TenantSchema>;
export type IncludedFeatures = z.infer<typeof IncludedFeaturesSchema>;
export type BillingInfo = z.infer<typeof BillingInfoSchema>;

const collection = db.collection("tenants");

export default {
  create: async (tenant: Partial<Omit<Tenant, "_id">>) => {
    const validated = TenantSchema.parse({ _id: new ObjectId(), ...tenant });
    const doc = {
      included_features: [
        {
          name: TenantFeature.TextPrompts,
          provider: ApiKeyProvider.OpenAI,
        },
      ],
      ...validated,
    };
    return await collection.insertOne(doc);
  },

  update: async (id: string | ObjectId, update: Partial<Tenant>) => {
    const objectId = toObjectId(id);
    const validated = TenantSchema.partial().parse(update);
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
      { $set: { active: isActive } },
    );
  },

  list: async () => {
    return collection.find<Document<Tenant>>({}).toArray();
  },

  listAllResellerCodes: async () => {
    return await collection.distinct("reseller_code", {
      is_reseller: true,
      reseller_code: { $ne: null },
    });
  },

  fetchPaginatedList: async (filterParams: TenantFilterParams) => {
    const { page, pageSize, searchValue, statusFlags, resellerCode } =
      filterParams;
    const skip = (page - 1) * pageSize;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baseMatch: any = {};

    // escape regex
    const escapeRegex = (text: string): string => {
      return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    };

    if (searchValue || statusFlags.length > 0 || resellerCode) {
      // Search filter
      if (searchValue) {
        const safeSearch = escapeRegex(searchValue.trim());
        (baseMatch.$and ??= []).push(
          { name: { $regex: safeSearch, $options: "i" } },
          { org_name: { $regex: safeSearch, $options: "i" } },
        );
      }

      // Status flag filter
      if (statusFlags.includes(FlagStatus.Internal)) {
        (baseMatch.$and ??= []).push({ is_internal: true });
      }

      // Reseller flag filter
      if (statusFlags.includes(FlagStatus.Reseller)) {
        (baseMatch.$and ??= []).push({ is_reseller: true });
      }

      // Archived flag filter
      if (statusFlags.includes(FlagStatus.Archived)) {
        (baseMatch.$and ??= []).push({ active: false });
      }

      // Reseller code filter
      if (resellerCode) {
        (baseMatch.$and ??= []).push({ owned_by_reseller: resellerCode });
      }
    } else {
      (baseMatch.$and ??= []).push({ active: true });
    }

    // Build pipeline dynamically
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipeline: any[] = [
      {
        // 🔍 search happens HERE (before lookups)
        $match: baseMatch,
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "tenant_id",
          as: "subscriptions",
        },
      },
      {
        $addFields: {
          // Include only the latest or first subscription
          subscription: { $arrayElemAt: ["$subscriptions", 0] },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          default_language: 1,
          comment: 1,
          totalPrice: 1,
          active: 1,
          is_internal: 1,
          is_reseller: 1,
          reseller_code: 1,
          owned_by_reseller: 1,
          included_user_limit: 1,
          extra_user_limit: 1,
          billing_info: 1,
          metadata: 1,
          azure_openai_instance_name: 1,
          subscription: 1,
        },
      },
      { $sort: { name: 1 } },
    ];

    // Trial flag filter
    if (statusFlags.includes(FlagStatus.Trial)) {
      pipeline.push({
        $match: { "subscription.is_trial": true },
      });
    }

    // ✅ Only paginate if pageSize > 0
    if (pageSize > 0) {
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: pageSize });
    }

    const totalPipeline: any[] = [
      { $match: baseMatch },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "tenant_id",
          as: "subscriptions",
        },
      },
      {
        $addFields: {
          subscription: { $arrayElemAt: ["$subscriptions", 0] },
        },
      },
    ];

    // ✅ merge trial filter only when needed
    if (statusFlags.includes(FlagStatus.Trial)) {
      totalPipeline.push({
        $match: { "subscription.is_trial": true },
      });
    }

    totalPipeline.push({ $count: "count" });

    const totalResult = await collection.aggregate(totalPipeline).toArray();
    const result = await collection
      .aggregate(pipeline, {
        collation: { locale: "en", strength: 2 },
      })
      .toArray();
    const total = totalResult[0]?.count ?? 0;

    return {
      data: result,
      total: total,
      page,
      pageSize,
    };
  },

  get: async (id: string | ObjectId): Promise<Tenant | null> => {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    const _id = toObjectId(id);
    return collection.findOne<Document<Tenant>>({ _id });
  },

  getByName: async (org_name: string) => {
    return await collection.findOne<Document<Tenant>>({ org_name });
  },

  getById: async (org_id: string) => {
    return await collection.findOne<Document<Tenant>>({ org_id });
  },

  getByResellerCode: async (resellerCode: string) => {
    return await collection.findOne<Document<Tenant>>({
      reseller_code: resellerCode,
    });
  },

  updateOrgName: async (org_id: string, newOrgName: string) => {
    return collection.updateOne(
      { org_id },
      {
        $set: {
          name: newOrgName,
          updated_at: new Date(),
        },
      },
    );
  },

  copyTenant: async (
    sourceId: string | ObjectId,
    overrides: Partial<Omit<Tenant, "_id">> = {},
  ) => {
    const id = toObjectId(sourceId);

    // fetch the original tenant
    const sourceTenant = await collection.findOne({ _id: id });
    if (!sourceTenant) {
      throw new Error("Source tenant not found");
    }

    // prepare the new tenant data
    const now = new Date();
    const newTenant: Partial<Omit<Tenant, "_id">> = {
      ...sourceTenant,
      ...overrides,
      created_at: now,
      updated_at: now,
    };

    delete (newTenant as any)._id; // ensure no ID conflict

    // insert the new tenant
    return await collection.insertOne(newTenant);
  },
};
