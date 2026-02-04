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

export const TenantFilterParamsSchema = z.object({
  page: z.number().default(1),
  pageSize: z.number().default(20),
  searchValue: z.string().nullish(),
  statusFlag: z.string().nullish(),
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
  comment: z.string().optional(),
  metadata: z.record(z.any()).nullish(),
  billing_method: z
    .nativeEnum(BillingMethod)
    .default(BillingMethod.MonthlyInvoice),
  billing_info: BillingInfoSchema.optional(),
  stripe_customer_id: z.string().nullish().default(null),
  totalPrice: z.string().optional(),
  max_user_limit: z.number().nullish().default(0),
  // Vector KB Configuration
  vector_kb_enabled: z.boolean().optional().default(false),
  vector_kb_embedding_provider: z.nativeEnum(EmbeddingProvider).nullish(),
  vector_kb_embedding_model: z.string().nullish(),
  vector_kb_chunk_size: z.number().optional().default(800),
  vector_kb_chunk_overlap: z.number().optional().default(200),
  vector_kb_max_storage_mb: z.number().optional().default(500),
  vector_kb_top_k: z.number().optional().default(5),
  vector_kb_similarity_threshold: z.number().optional().default(0.7),
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

  fetchPaginatedList: async (filterParams: TenantFilterParams) => {
    const { page, pageSize, searchValue, statusFlag, resellerCode } =
      filterParams;
    const skip = (page - 1) * pageSize;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baseMatch: any = {};

    // escape regex
    const escapeRegex = (text: string): string => {
      return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    };

    if (searchValue || statusFlag || resellerCode) {
      if (searchValue) {
        const safeSearch = escapeRegex(searchValue.trim());
        baseMatch.$or = [
          { name: { $regex: safeSearch, $options: "i" } },
          { org_name: { $regex: safeSearch, $options: "i" } },
        ];
      }

      if (statusFlag === FlagStatus.Internal) {
        //filter.active = false;
      }

      if (resellerCode) {
        //filter.active = false;
      }
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
          totalPrice: 1,
          active: 1,
          is_trial: 1,
          subscription: 1,
        },
      },
      { $sort: { created_at: 1 } },
      { $skip: skip },
      { $limit: pageSize },
    ];

    const totalResult = await collection
      .aggregate([
        { $match: baseMatch },
        {
          $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "tenant_id",
            as: "subscriptions",
          },
        },
        { $count: "count" },
      ])
      .toArray();

    const result = await collection.aggregate(pipeline).toArray();
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
