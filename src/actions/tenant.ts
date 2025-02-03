import { defineAction } from "astro:actions";
import type { PatchOrganizationsByIdRequest } from "auth0";
import { ObjectId } from "mongodb";
import { client } from "$data/mongodb";
import { z } from "zod";
import { decrypt, encrypt } from "$utils/secure";
import { transformRawData } from "$utils/transformRawData";

import organizationsManagement from "$data/auth0/organizations-manager";
import TenantModel, {
  IncludedFeaturesSchema,
  TenantFilterParamsSchema,
  TenantTheme,
  type Tenant,
} from "$data/models/tenant.model";
import PromptModel from "$data/models/prompt.model";
import CategoryModel from "$data/models/category.model";
import KnowledgeBaseModel from "$data/models/knowledgeBase.model";
import { ApiKeyProvider } from "$types/TenantFeature";

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
  speech_api_key: z.string().optional(),
  speech_region: z.string().optional(),
  included_features: z.array(IncludedFeaturesSchema),
  is_restrict_user_managment: z
    .boolean()
    .optional()
    .default(() => false),
});

const TenanKeyEncryptSchema = z.object({
  openai_api_key: z.string().optional(),
  azure_openai_api_key: z.string().optional(),
  speech_api_key: z.string().optional(),
});

const TenantInputIdentifierSchema = z.object({
  _id: z.string(),
});

export const tenant = {
  get: defineAction({
    input: TenantInputIdentifierSchema,
    handler: async (input) => {
      const data = await TenantModel.get(input._id);
      return transformRawData(data);
    },
  }),

  list: defineAction({
    input: TenantFilterParamsSchema,
    handler: async (input) => {
      const data = await TenantModel.list(input);
      return transformRawData(data);
    },
  }),

  create: defineAction({
    input: TenantInputParamsSchema,
    handler: async (input) => {
      const session = client.startSession();
      session.startTransaction();
      try {
        const organizationResult = await organizationsManagement.create({
          name: input.org_name,
          display_name: input.name,
        });

        await organizationsManagement.addEnabledConnection(
          organizationResult.data.id,
          import.meta.env.AUTH0_AUTH_CON_ID || "con_RXTD1LIbXJgceOUH",
        );

        const tenant: Partial<Omit<Tenant, "_id">> = {
          ...input,
          org_id: organizationResult.data.id,
        };
        const insertResult = await TenantModel.create(tenant);

        await session.commitTransaction();
        return transformRawData(insertResult);
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    },
  }),

  update: defineAction({
    input: z.intersection(TenantInputParamsSchema, TenantInputIdentifierSchema),
    handler: async (input) => {
      const session = client.startSession();
      session.startTransaction();
      try {
        const update: Partial<Tenant> = {
          ...input,
          _id: new ObjectId(input._id),
        };
        const updatedDocument = await TenantModel.update(input._id, update);

        const bodyParameters: PatchOrganizationsByIdRequest = {
          name: input.org_name,
          display_name: input.name,
        };
        await organizationsManagement.update(
          updatedDocument?.org_id,
          bodyParameters,
        );

        await session.commitTransaction();
        return transformRawData(updatedDocument);
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    },
  }),

  active: defineAction({
    input: TenantInputIdentifierSchema,
    handler: async (input) => {
      const updateResult = await TenantModel.updateActiveStatus(
        input._id,
        true,
      );
      return transformRawData(updateResult);
    },
  }),

  archive: defineAction({
    input: TenantInputIdentifierSchema,
    handler: async (input) => {
      const updateResult = await TenantModel.updateActiveStatus(
        input._id,
        false,
      );
      return transformRawData(updateResult);
    },
  }),

  delete: defineAction({
    input: TenantInputIdentifierSchema,
    handler: async (input) => {
      const tenant = await TenantModel.get(input._id);
      if (!tenant) throw new Error("Tenant does not exist.");

      const session = client.startSession();

      try {
        await organizationsManagement.deleteTenant(tenant.org_id);
        session.startTransaction();

        await Promise.all([
          CategoryModel.removeByTenant(input._id),
          KnowledgeBaseModel.removeByTenant(input._id),
          PromptModel.removeByTenant(input._id),
        ]);
        await TenantModel.remove(input._id);

        await session.commitTransaction();
        return transformRawData({});
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    },
  }),

  encryptApiKeys: defineAction({
    input: TenanKeyEncryptSchema,
    handler: async (input) => {
      const { openai_api_key, azure_openai_api_key, speech_api_key } = input;
      if (openai_api_key) {
        input.openai_api_key = encrypt(openai_api_key);
      }
      if (azure_openai_api_key) {
        input.azure_openai_api_key = encrypt(azure_openai_api_key);
      }
      if (speech_api_key) {
        input.speech_api_key = encrypt(speech_api_key);
      }

      return input;
    },
  }),

  decryptApiKeys: defineAction({
    input: TenanKeyEncryptSchema,
    handler: async (input) => {
      const { openai_api_key, azure_openai_api_key, speech_api_key } = input;
      if (openai_api_key) {
        input.openai_api_key = decrypt(openai_api_key);
      }
      if (azure_openai_api_key) {
        input.azure_openai_api_key = decrypt(azure_openai_api_key);
      }
      if (speech_api_key) {
        input.speech_api_key = decrypt(speech_api_key);
      }

      return input;
    },
  }),
};
