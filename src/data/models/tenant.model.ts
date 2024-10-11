import { ObjectId } from "mongodb";
import { db, type Document } from "../mongodb";
import { z } from "zod";

export enum TenantTheme {
  Light = "light",
  Dark = "dark",
  Luxury = "luxury",
  Lemonade = "lemonade",
  Somedia = "somedia",
}

export enum TenantFeature {
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

const TenantSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  name: z.string().min(1),
  org_name: z.string().min(1),
  org_id: z.string(),
  default_language: z.string().nullish(),
  theme: z.nativeEnum(TenantTheme),
  primary_color: z.string().nullish(),
  api_key_provider: z.nativeEnum(ApiKeyProvider).optional(),
  openai_api_key: z.string().nullish(),
  azure_openai_api_key: z.string().nullish(),
  included_features: z.array(z.nativeEnum(TenantFeature)).optional(),
  active: z.boolean().default(true).optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});
export type Tenant = z.infer<typeof TenantSchema>;

const collection = db.collection("tenants");

export default {
  create: async (tenant: Tenant) => {
    const validated = TenantSchema.parse(tenant);
    const doc = {
      ...validated,
      ...{
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    };
    return await collection.insertOne(doc);
  },

  update: async (id: string, tenant: Tenant) => {
    const validated = TenantSchema.partial().parse(tenant);
    const doc = {
      ...validated,
      ...{
        updated_at: new Date(),
      },
    };
    return await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
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
      }
    );
  },

};
