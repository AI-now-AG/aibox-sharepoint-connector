import { defineAction } from "astro:actions";
import type { PatchOrganizationsByIdRequest } from "auth0";
import { ObjectId } from "mongodb";
import { client } from "$data/mongodb";
import { z } from "zod";
import { decrypt, encrypt } from "$utils/secure";
import { transformRawData } from "$utils/transformRawData";
import { createBillingPortalSession } from "$utils/stripe";
import usersManagement from "$data/auth0/users-manager";
import rolesManagement from "$data/auth0/roles-manager";
import organizationsManagement from "$data/auth0/organizations-manager";
import TenantModel, {
  IncludedFeaturesSchema,
  TenantFilterParamsSchema,
  TenantTheme,
  TextFeatureSchema,
  type Tenant,
} from "$data/models/tenant.model";
import UserModel, { assignPermissions } from "$data/models/user.model";
import SubscriptionModel, {
  type Subscription,
} from "$data/models/subscription.model";
import PromptModel from "$data/models/prompt.model";
import CategoryModel from "$data/models/category.model";
import KnowledgeBaseModel from "$data/models/knowledgeBase.model";
import { AudioCategory } from "$types/TenantFeature";
import {
  SubscriptionPackageId,
  SubscriptionExtraPackage,
  AudioOptionId,
} from "$types/Subscription";
import { EncryptedUserPassword, UserRole } from "$types/Users";

const TenantInputParamsSchema = z.object({
  name: z.string(),
  org_name: z.string(),
  org_id: z.string().optional(),
  default_language: z.string(),
  theme: z.nativeEnum(TenantTheme),
  primary_color: z.string().optional(),
  api_key_providers: z.array(TextFeatureSchema).optional(),
  openai_api_key: z.string().optional(),
  azure_openai_api_key: z.string().optional(),
  azure_openai_endpoint: z.string().optional(),
  azure_openai_instance_name: z.string().optional(),
  azure_openai_whisper_model: z.string().optional(),
  azure_openai_chat_model: z.string().optional(),
  speech_api_key: z.string().optional(),
  elevenLabs_api_key: z.string().optional(),
  speech_region: z.string().optional(),
  perplexity_api_key: z.string().optional(),
  perplexity_chat_model: z.string().optional(),
  fal_ai_api_key: z.string().optional(),
  claude_api_key: z.string().optional(),
  claude_chat_model: z.string().optional(),
  included_features: z.array(IncludedFeaturesSchema),
  transcription_types: z.array(z.nativeEnum(AudioCategory)).optional(),
  is_restrict_user_managment: z
    .boolean()
    .optional()
    .default(() => false),
  is_trial: z.boolean().optional().default(false),
  metadata: z.record(z.any()).optional(),
  tenant_admin_email: z.string().optional(),
  billing_info: z.record(z.any()).optional(),
});

const TenanKeyEncryptSchema = z.object({
  openai_api_key: z.string().optional(),
  azure_openai_api_key: z.string().optional(),
  perplexity_api_key: z.string().optional(),
  speech_api_key: z.string().optional(),
  elevenLabs_api_key: z.string().optional(),
  fal_ai_api_key: z.string().optional(),
  claude_api_key: z.string().optional(),
});

const TenantInputIdentifierSchema = z.object({
  _id: z.string(),
});

const CreateTenantAdminSchema = z.object({
  _id: z.string(),
  org_id: z.string().optional(),
  tenant_admin_email: z.string().optional(),
});

const SubscriptionInputParamsSchema = z.object({
  plan_name: z
    .nativeEnum({ ...SubscriptionPackageId, ...SubscriptionExtraPackage })
    .or(z.literal(""))
    .optional(),
  add_ons: z.array(z.nativeEnum(AudioOptionId)).optional(),
});

const assignMemberRoles = async (
  organizationId: string,
  userId: string,
  oldRoles: string[],
  newRoles: string[],
) => {
  // Get all roles from Auth0
  const allRoles = await rolesManagement.getAll();

  // Detach old member roles
  if (oldRoles.length > 0) {
    const rolesToDetach = allRoles.data
      .filter((role) => {
        return oldRoles.includes(role.name);
      })
      .map((role) => role.id);
    await organizationsManagement.deleteMemberRoles(
      organizationId,
      userId,
      rolesToDetach,
    );
  }

  // Attach new member roles
  if (newRoles.length > 0) {
    const rolesToAttach = allRoles.data
      .filter((role) => {
        return newRoles.includes(role.name);
      })
      .map((role) => role.id);
    await organizationsManagement.addMemberRoles(
      organizationId,
      userId,
      rolesToAttach,
    );
  }
};

const setupTenantAdmin = async (
  dbOrgId: string,
  organizationId: string,
  email: string,
  name?: string,
) => {
  let user;
  let userId;

  const oldRoles: string[] = [];
  const newRoles: UserRole[] = [UserRole.User, UserRole.Admin];

  const existingUsers = await usersManagement.getByEmail(email?.trim());
  if (
    existingUsers &&
    Array.isArray(existingUsers.data) &&
    existingUsers.data.length > 0
  ) {
    user = existingUsers.data[0];
    userId = user.user_id;
    console.log("Assign existing user to Admin", user);
  } else {
    const newUserResult = await usersManagement.create({
      email: email,
      name: name ?? "Admin",
      connection: "Username-Password-Authentication",
      password: EncryptedUserPassword,
    });
    user = newUserResult.data;
    userId = user.user_id;
    console.log("Create new Amin user", user);
  }

  await UserModel.upsertByAuth0Sub(userId, {
    tenant_id: new ObjectId(dbOrgId),
    auth0_sub: user.user_id,
    username: user.nickname,
    name: user.name,
    email: user.email,
    picture: user.picture,
    roles: newRoles,
    permissions: assignPermissions(newRoles),
    last_login: user.last_login?.toString(),
    logins_count: user.logins_count || 0,
    email_verified: user.email_verified,
    blocked: user.blocked,
  });

  // Add user to Auth0 organization and assign roles
  await Promise.all([
    organizationsManagement.addMembers(organizationId, [userId]),
    assignMemberRoles(organizationId, userId, oldRoles, newRoles),
  ]);
};

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

  createAdminUser: defineAction({
    input: CreateTenantAdminSchema,
    handler: async (input) => {
      const session = client.startSession();
      session.startTransaction();

      try {
        const dbOrgId = input._id;
        const organizationId = input.org_id ?? "";

        if (input.tenant_admin_email) {
          await setupTenantAdmin(
            dbOrgId,
            organizationId,
            input.tenant_admin_email,
            "Admin",
          );
        }
        await session.commitTransaction();
        return {};
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    },
  }),

  create: defineAction({
    input: z.object({
      tenant: TenantInputParamsSchema,
      subscription: SubscriptionInputParamsSchema,
    }),
    handler: async (input) => {
      const session = client.startSession();
      session.startTransaction();

      const { tenant: tenantInput, subscription: subInput } = input;

      try {
        // create new Auth0 organization
        const organizationResult = await organizationsManagement.create({
          name: tenantInput.org_name,
          display_name: tenantInput.name,
        });

        const organizationId = organizationResult.data.id;

        await organizationsManagement.addEnabledConnection(
          organizationId,
          import.meta.env.AUTH0_AUTH_CON_ID || "con_RXTD1LIbXJgceOUH",
        );

        // create new tenant
        const tenant: Partial<Omit<Tenant, "_id">> = {
          ...tenantInput,
          org_id: organizationId,
        };
        const insertResult = await TenantModel.create(tenant);

        // create new subscription
        const subData: Partial<Omit<Subscription, "_id">> = {
          ...subInput,
          tenant_id: insertResult.insertedId,
        };
        await SubscriptionModel.create(subData);

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
    input: z.object({
      tenant: z.intersection(
        TenantInputParamsSchema,
        TenantInputIdentifierSchema,
      ),
      subscription: SubscriptionInputParamsSchema,
    }),
    handler: async (input) => {
      const session = client.startSession();
      session.startTransaction();

      const { tenant: tenantInput, subscription: subInput } = input;
      try {
        // update tenant
        const update: Partial<Tenant> = {
          ...tenantInput,
          _id: new ObjectId(tenantInput._id),
        };
        const updatedDocument = await TenantModel.update(
          tenantInput._id,
          update,
        );
        const organizationId = updatedDocument?.org_id;

        // update subscription
        const subUpdate: Partial<Subscription> = subInput;
        await SubscriptionModel.update(tenantInput._id, subUpdate);

        // sync Auth0 organization
        const bodyParameters: PatchOrganizationsByIdRequest = {
          name: tenantInput.org_name,
          display_name: tenantInput.name,
        };
        await organizationsManagement.update(organizationId, bodyParameters);

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
      session.startTransaction();

      try {
        await organizationsManagement.deleteTenant(tenant.org_id);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        console.error("Delete organization on Auth0 error");
      }

      try {
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
      const keysToEncrypt = [
        "openai_api_key",
        "azure_openai_api_key",
        "perplexity_api_key",
        "speech_api_key",
        "fal_ai_api_key",
        "claude_api_key",
      ] as const;

      for (const key of keysToEncrypt) {
        if (input[key]) {
          input[key] = encrypt(input[key]!);
        }
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

  stripeBillingPortal: defineAction({
    input: z.object({
      customer_id: z.string().min(1),
      return_url: z.string().min(1),
    }),
    handler: async (input) => {
      const { customer_id: customerId, return_url: returnUrl } = input;

      const portalUrl = await createBillingPortalSession(customerId, returnUrl);
      return { url: portalUrl };
    },
  }),
};
