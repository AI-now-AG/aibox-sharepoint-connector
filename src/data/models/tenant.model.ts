import { ObjectId } from "mongodb";
import { db, type Document } from "../mongodb";
import { z } from "zod";

export enum TenantTheme {
  Light = "light",
  Dark = "dark",
  Luxury = "luxury",
  Lemonade = "lemonade",
  Somedia = "somedia",
  Weihnachtsmann = "weihnachtsmann",
}

export enum TenantFeature {
  TextPrommpts = "text-prommpts",
  AudioToText = "audio-to-text",
}

export enum ApiKeyProvider {
  OpenAI = "openai",
  AzureOpenAI = "azure_openai",
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

// export const InstructionsSchema = z.object({
//   transcription_subtitle: z.string().optional(),
//   transcription_plaintext: z.string().optional(),
//   transcription_summary: z.string().optional(),
// });

export const TranscriptionsSchema = z.object({
  plaintext: z.object({
    enabled: z.boolean().default(false),
    text: z.string().optional(),
  }).optional(),
  summary: z.object({
    enabled: z.boolean().default(false),
    text: z.string().optional(),
  }).optional(),
  subtitles: z.object({
    enabled: z.boolean().default(false),
    text: z.string().optional(),
  }).optional(),
});

const TenantSchema = z.object({
  _id: z.instanceof(ObjectId),
  name: z.string().min(1),
  org_name: z.string().min(1),
  org_id: z.string(),
  default_language: z.string().nullish(),
  theme: z.nativeEnum(TenantTheme),
  primary_color: z.string().nullish(),
  api_key_provider: z.nativeEnum(ApiKeyProvider).optional(),
  openai_api_key: z.string().nullish(),
  azure_openai_api_key: z.string().nullish(),
  azure_openai_endpoint: z.string().nullish(),
  azure_openai_instance_name: z.string().nullish(),
  azure_openai_whisper_model: z.string().nullish(),
  azure_openai_chat_model: z.string().nullish(),
  included_features: z.array(IncludedFeaturesSchema),
  transcriptions: TranscriptionsSchema.nullish(),
  active: z.boolean().default(true).optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});
export type Tenant = z.infer<typeof TenantSchema>;
export type Transcriptions = z.infer<typeof TranscriptionsSchema>;
export type IncludedFeatures = z.infer<typeof IncludedFeaturesSchema>;

const collection = db.collection("tenants");

export default {
  create: async (tenant: Omit<Tenant, "_id">) => {
    const validated = TenantSchema.parse({ _id: new ObjectId(), ...tenant });
    const doc = {
      ...{
        active: true,
        included_features: [
          {
            name: TenantFeature.TextPrommpts,
            provider: ApiKeyProvider.OpenAI,
          },
        ],
        transcriptions: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      ...validated,
    };
    return await collection.insertOne(doc);
  },

  update: async (id: string | ObjectId, update: Partial<Tenant>) => {
    const objectId = id instanceof ObjectId ? id : new ObjectId(id);
    const validated = TenantSchema.partial().parse(update);
    const doc = {
      ...validated,
      ...{
        updated_at: new Date(),
      },
    };
    return await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: doc },
      {
        returnDocument: "after",
      },
    );
  },

  active: async (id: string) => {
    return await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { active: true } },
    );
  },

  archive: async (id: string) => {
    return await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { active: false } },
    );
  },

  list: async (filterParams?: TenantFilterParams) => {
    let filter = {
      active: true,
    };

    if (filterParams) {
      const { searchValue, showArchived } = filterParams;

      if (searchValue) {
        filter = {
          ...filter,
          ...{
            name: {
              $regex: searchValue,
              $options: "i",
            },
          },
        };
      }

      if (showArchived) {
        filter = {
          ...filter,
          ...{
            active: false,
          },
        };
      }
    }

    const data = collection.find<Document<Tenant>>(filter);
    return await data.toArray();
  },

  get: async (id: string) => {
    return await collection.findOne<Document<Tenant>>({
      _id: new ObjectId(id),
    });
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
};
