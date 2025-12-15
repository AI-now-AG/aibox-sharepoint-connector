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
import { ModelName, ReasoningEffortOption } from "$types/AIProvider";

export const TenantFilterParamsSchema = z.object({
  searchValue: z.string().nullish(),
  showArchived: z.boolean(),
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

  list: async (filterParams?: TenantFilterParams) => {
    const filter: any = {
      active: true,
    };

    if (filterParams) {
      const { searchValue, showArchived } = filterParams;

      if (searchValue) {
        filter.name = { $regex: searchValue, $options: "i" };
      }

      if (showArchived) {
        filter.active = false;
      }
    }

    const pipeline = [
      { $match: filter },
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
          subscriptions: 0, // hide the full array coz only need one
        },
      },
    ];

    const data = await collection
      .aggregate<Document<Tenant & { subscription?: any }>>(pipeline)
      .toArray();

    return data;
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
