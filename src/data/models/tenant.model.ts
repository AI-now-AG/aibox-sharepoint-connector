import { ObjectId } from "mongodb";
import { db, toObjectId, type Document } from "../mongodb";
import { z } from "zod";
import {
  TenantFeature,
  ApiKeyProvider,
  AudioCategory,
} from "$types/TenantFeature";
import { BillingMethod } from "$types/Subscription";

export enum TenantTheme {
  Light = "light",
  Dark = "dark",
  AIBox = "aibox",
  Somedia = "somedia",
  Weihnachtsmann = "weihnachtsmann",
}

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
  theme: z.nativeEnum(TenantTheme).default(TenantTheme.Light),
  primary_color: z.string().nullish(),
  api_key_providers: z.array(TextFeatureSchema).optional(),
  openai_api_key: z.string().nullish().default(null),
  azure_openai_api_key: z.string().nullish().default(null),
  azure_openai_endpoint: z.string().nullish().default(null),
  azure_openai_instance_name: z.string().nullish().default(null),
  azure_openai_whisper_model: z.string().nullish().default(null),
  azure_openai_chat_model: z.string().nullish().default(null),
  included_features: z.array(IncludedFeaturesSchema).optional(),
  transcription_types: z.array(z.nativeEnum(AudioCategory)).optional(),
  speech_api_key: z.string().nullish(),
  elevenLabs_api_key: z.string().optional(),
  speech_region: z.string().nullish(),
  perplexity_api_key: z.string().nullish(),
  perplexity_chat_model: z.string().nullish(),
  fal_ai_api_key: z.string().nullish(),
  anthropic_api_key: z.string().nullish(),
  anthropic_chat_model: z.string().nullish(),
  active: z.boolean().optional().default(true),
  is_restrict_user_managment: z.boolean().optional().default(false),
  is_trial: z.boolean().optional().default(false),
  metadata: z.record(z.any()).nullish(),
  billing_method: z
    .nativeEnum(BillingMethod)
    .default(BillingMethod.MonthlyInvoice),
  billing_info: BillingInfoSchema.optional(),
  stripe_customer_id: z.string().nullish().default(null),
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
    console.log("doc", doc);
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
    // Start with a default filter for active tenants
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {
      active: true,
    };

    // If filterParams are provided, adjust the filter accordingly
    if (filterParams) {
      const { searchValue, showArchived } = filterParams;

      // Add search filter if there's a search value
      if (searchValue) {
        filter.name = {
          $regex: searchValue,
          $options: "i",
        };
      }

      // Adjust filter to include archived tenants if requested
      if (showArchived) {
        filter.active = false; // Overwrites active to false for archived tenants
      }
    }

    const data = collection.find<Document<Tenant>>(filter);
    return await data.toArray();
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (newTenant as any)._id; // ensure no ID conflict

    // insert the new tenant
    return await collection.insertOne(newTenant);
  },
};
