import { defineAction } from "astro:actions";
import { ObjectId } from "mongodb";
import { z } from "zod";
import tenantModel, {
  TenantTheme,
  ApiKeyProvider,
  TenantFilterParamsSchema,
  IncludedFeaturesSchema,
  type Tenant,
} from "$data/models/tenant.model";
import { transformRawData } from "$utils/transformRawData";
import organizationsManagement, {
  type PostOrganizationsRequest,
  type PatchOrganizationsByIdRequest,
} from "$data/auth0/organizations-manager";
import log from "$utils/log";
import { encrypt, decrypt } from "$utils/secure";

const TenantInputParamsSchema = z.object({
  name: z.string(),
  org_name: z.string(),
  default_language: z.string(),
  theme: z.nativeEnum(TenantTheme),
  primary_color: z.string().optional(),
  api_key_provider: z.nativeEnum(ApiKeyProvider).optional(),
  openai_api_key: z.string().optional(),
  azure_openai_api_key: z.string().optional(),
  azure_openai_endpoint: z.string().optional(),
  azure_openai_instance_name: z.string().optional(),
  azure_openai_whisper_model: z.string().optional(),
  azure_openai_chat_model: z.string().optional(),
  included_features: z.array(IncludedFeaturesSchema),
});

const TenanKeyEncryptSchema = z.object({
  openai_api_key: z.string().optional(),
  azure_openai_api_key: z.string().optional(),
});

const TenantInputIdentifierSchema = z.object({
  _id: z.string(),
});

export const tenant = {
  get: defineAction({
    input: TenantInputIdentifierSchema,
    handler: async (input) => {
      const data = await tenantModel.get(input._id);
      return transformRawData(data);
    },
  }),

  list: defineAction({
    input: TenantFilterParamsSchema,
    handler: async (input) => {
      const data = await tenantModel.list(input);
      return transformRawData(data);
    },
  }),

  create: defineAction({
    input: TenantInputParamsSchema,
    handler: async (input) => {
      // create new organization on auth0
      const bodyParameters: PostOrganizationsRequest = {
        name: input.org_name,
        display_name: input.name,
      };
      const organizationResult =
        await organizationsManagement.create(bodyParameters);

      // add connection on auth0
      await organizationsManagement.addEnabledConnection(
        organizationResult.data.id,
        import.meta.env.AUTH0_AUTH_CON_ID || "con_RXTD1LIbXJgceOUH",
      );

      // store tenant on mongodb
      const { id: organizationId } = organizationResult.data;
      const tenant: Omit<Tenant, "_id"> = {
        ...input,
        ...{ org_id: organizationId },
      };
      const insertResult = await tenantModel.create(tenant);

      return transformRawData(insertResult);
    },
  }),

  update: defineAction({
    input: z.intersection(TenantInputParamsSchema, TenantInputIdentifierSchema),
    handler: async (input) => {
      // update tenant on mongodb
      const tenant: Partial<Tenant> = {
        ...input,
        ...{ _id: new ObjectId(input._id) },
      };
      const updatedDocument = await tenantModel.update(input._id, tenant);

      // update existing organization on auth0
      const bodyParameters: PatchOrganizationsByIdRequest = {
        name: input.org_name,
        display_name: input.name,
      };
      await organizationsManagement.update(
        updatedDocument?.org_id,
        bodyParameters,
      );

      return transformRawData(updatedDocument);
    },
  }),

  active: defineAction({
    input: TenantInputIdentifierSchema,
    handler: async (input) => {
      const updateResult = await tenantModel.active(input._id);
      return transformRawData(updateResult);
    },
  }),

  archive: defineAction({
    input: TenantInputIdentifierSchema,
    handler: async (input) => {
      const updateResult = await tenantModel.archive(input._id);
      return transformRawData(updateResult);
    },
  }),

  encryptApiKeys: defineAction({
    input: TenanKeyEncryptSchema,
    handler: async (input) => {
      const { openai_api_key, azure_openai_api_key } = input;
      if (openai_api_key) {
        input.openai_api_key = encrypt(openai_api_key);
      }
      if (azure_openai_api_key) {
        input.azure_openai_api_key = encrypt(azure_openai_api_key);
      }

      return input;
    },
  }),

  decryptApiKeys: defineAction({
    input: TenanKeyEncryptSchema,
    handler: async (input) => {
      const { openai_api_key, azure_openai_api_key } = input;
      if (openai_api_key) {
        input.openai_api_key = decrypt(openai_api_key);
      }
      if (azure_openai_api_key) {
        input.azure_openai_api_key = decrypt(azure_openai_api_key);
      }

      return input;
    },
  }),
};
