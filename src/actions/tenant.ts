import { defineAction } from "astro:actions";
import type {
  PatchOrganizationsByIdRequest,
  PostOrganizationsRequest,
} from "auth0";
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
      // Start a new client session for MongoDB operations.
      const session = client.startSession();

      try {
        // Start a transaction to ensure atomicity.
        session.startTransaction();

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
        const tenant: Partial<Omit<Tenant, "_id">> = {
          ...input,
          org_id: organizationId,
        };
        const insertResult = await TenantModel.create(tenant);

        // If everything goes well, commit the transaction
        await session.commitTransaction();

        return transformRawData(insertResult);
      } catch (error) {
        // If an error occurs, abort the transaction and log the error
        await session.abortTransaction();
        throw error;
      } finally {
        // End the session after the transaction
        session.endSession();
      }
    },
  }),

  update: defineAction({
    input: z.intersection(TenantInputParamsSchema, TenantInputIdentifierSchema),
    handler: async (input) => {
      // Start a new client session for MongoDB operations.
      const session = client.startSession();

      try {
        // Start a transaction to ensure atomicity.
        session.startTransaction();

        // Update tenant in the local database.
        const update: Partial<Tenant> = {
          ...input,
          _id: new ObjectId(input._id),
        };
        const updatedDocument = await TenantModel.update(input._id, update);

        // Update an existing organization in Auth0
        const bodyParameters: PatchOrganizationsByIdRequest = {
          name: input.org_name,
          display_name: input.name,
        };
        await organizationsManagement.update(
          updatedDocument?.org_id,
          bodyParameters,
        );

        // If everything goes well, commit the transaction
        await session.commitTransaction();

        return transformRawData(updatedDocument);
      } catch (error) {
        // If an error occurs, abort the transaction and log the error
        await session.abortTransaction();
        throw error;
      } finally {
        // End the session after the transaction
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
      // Retrieve the user details from the database.
      const user = await TenantModel.get(input._id);
      if (!user || Object.keys(user).length == 0) {
        throw new Error("User does not exists.");
      }

      // Start a new client session for MongoDB operations.
      const session = client.startSession();

      // Delete organization in Auth0; log error and continue if it fails.
      try {
        await organizationsManagement.deleteTenant(input._id);
      } catch (err) {
        console.error("delete tenant on Auth0 error", err);
      }

      try {
        // Start a transaction to ensure atomicity.
        session.startTransaction();

        // Delete all prompts, categories, groups and knowledge bases
        await CategoryModel.removeByTenant(input._id);
        await KnowledgeBaseModel.removeByTenant(input._id);
        await PromptModel.removeByTenant(input._id);
        await TenantModel.remove(input._id);

        // If everything goes well, commit the transaction
        await session.commitTransaction();

        return transformRawData({});
      } catch (error) {
        // If an error occurs, abort the transaction and log the error
        await session.abortTransaction();
        throw error;
      } finally {
        // End the session after the transaction
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
