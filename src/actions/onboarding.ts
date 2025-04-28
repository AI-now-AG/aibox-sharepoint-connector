import { defineAction } from "astro:actions";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { transformRawData } from "$utils/transformRawData";
import UserModel, { assignPermissions } from "$data/models/user.model";
import TenantModel from "$data/models/tenant.model";
import CategoryModel, {
  type Category,
  type Group,
} from "$data/models/category.model";
import PromptModel, { type Prompt } from "$data/models/prompt.model";
import SubscriptionModel, {
  type Subscription,
} from "$data/models/subscription.model";
import TranscriptionModel, {
  type Transcription,
} from "$data/models/transcription.model";
import {
  SubscriptionPackageId,
  AudioOptionId,
  AudioOptionLabels,
} from "$types/Subscription";
import { UserRole, TourType } from "$types/Users";
import { AudioCategory } from "$types/TenantFeature";
import { SocialProvider } from "$types/Auth0Auth";
import organizationsManagement from "$data/auth0/organizations-manager";
import sendMail from "$utils/mail";
import { isProd } from "$utils/env";
import { randomString } from "$utils/common";
import { isSocialConnection } from "$utils/auth0Auth";
import {
  TENANT_MASTER_DEV,
  TENANT_MASTER_PROD,
  SG_NEW_TENANT_TEMPLATE,
  AUTH0_ROLE_ADMIN_PROD,
  AUTH0_ROLE_ADMIN_DEV,
  AUTH0_AUTH_GOOGLE_CON_DEV,
  AUTH0_AUTH_WINDOWS_CON_DEV,
  AUTH0_AUTH_GOOGLE_CON_PROD,
  AUTH0_AUTH_WINDOWS_CON_PROD,
} from "$constants";

const masterTenantId = isProd() ? TENANT_MASTER_PROD : TENANT_MASTER_DEV;
const auth0GoogleCon = isProd()
  ? AUTH0_AUTH_GOOGLE_CON_PROD
  : AUTH0_AUTH_GOOGLE_CON_DEV;
const auth0WindowsCon = isProd()
  ? AUTH0_AUTH_WINDOWS_CON_PROD
  : AUTH0_AUTH_WINDOWS_CON_DEV;
const OrganizationNameInputParamsSchema = z.object({
  company_name: z.string().min(1),
});

const OrganizationIdInputParamsSchema = z.object({
  org_id: z.string().min(1),
});
const TenantInputParamsSchema = z.object({
  name: z.string().min(1),
  org_id: z.string().min(1),
  org_name: z.string().min(1),
  language: z.string().min(1),
  plan_name: z.nativeEnum(SubscriptionPackageId).optional(),
  add_ons: z.array(z.nativeEnum(AudioOptionId)).optional(),
  billing: z.object({
    company_name: z.string(),
    address: z.string(),
    zip_code: z.string(),
    location: z.string(),
    email: z.string(),
  }),
  use_cases: z.array(z.string()),
});
const TenantEmailInputParamsSchema = z.object({
  tenant_id: z.string().min(1),
});

const getTranscriptionTypes = (selectedAddOns: AudioOptionId[]) => {
  let transcriptionTypes = [];

  // Audio Basis + Add-ons
  if (selectedAddOns?.includes(AudioOptionId.AudioBasis)) {
    transcriptionTypes.push(AudioCategory.AudioToText);
  }
  if (selectedAddOns?.includes(AudioOptionId.AudioBasisAddOnSubtitle)) {
    transcriptionTypes.push(AudioCategory.Subtitle);
  }
  if (selectedAddOns?.includes(AudioOptionId.AudioBasisAddOnLarge)) {
    transcriptionTypes.push(AudioCategory.SubtitleLarge);
  }

  // Audio Premium
  if (selectedAddOns?.includes(AudioOptionId.AudioPremium)) {
    transcriptionTypes = [
      AudioCategory.AudioToText,
      AudioCategory.Subtitle,
      AudioCategory.AudioPro,
      AudioCategory.SubtitleLarge,
    ];
  }

  return transcriptionTypes;
};

// step 1: createOrganization()  - Create Auth0 organization
// step 2: createMember()  - Create Auth0 user, move user from trial org to new org
// step 3: setupTenantData() - Clone tenant & import categories / prompts
// step 4: finalize()  - Send notification emails

export const onboarding = {
  createOrganization: defineAction({
    input: OrganizationNameInputParamsSchema,
    handler: async (input, context) => {
      const { company_name: companyName } = input;
      const { user } = context.locals;
      const name = companyName
        .toLowerCase()
        .normalize("NFKD") // Remove accents/diacritics
        .replace(/[\u0300-\u036f]/g, "") // Strip combining characters
        .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphen
        .replace(/^-+|-+$/g, "") // Trim leading/trailing hyphens
        .replace(/-{2,}/g, "-"); // Collapse multiple hyphens
      const orgName = `${name}-${randomString(5)}`;

      // create new Auth0 organization
      const organizationResult = await organizationsManagement.create({
        name: orgName.toLowerCase(),
        display_name: companyName,
      });

      const organizationId = organizationResult.data.id;

      // enable database-pwd connection
      await organizationsManagement.addEnabledConnection(
        organizationId,
        import.meta.env.AUTH0_AUTH_CON_ID || "con_RXTD1LIbXJgceOUH",
      );

      // enable social connections
      if (isSocialConnection(user.auth0_sub, SocialProvider.GOOGLE)) {
        await organizationsManagement.addEnabledConnection(
          organizationId,
          auth0GoogleCon,
        );
      }
      if (isSocialConnection(user.auth0_sub, SocialProvider.WINDOWS)) {
        await organizationsManagement.addEnabledConnection(
          organizationId,
          auth0WindowsCon,
        );
      }

      return transformRawData(organizationResult.data);
    },
  }),
  createMember: defineAction({
    input: OrganizationIdInputParamsSchema,
    handler: async (input, context) => {
      const { org_id: organizationId } = input;

      // delete current user in trial organization
      // move current user to new organization
      await organizationsManagement.deleteMembers(
        context.locals.tenant.org_id,
        [context.locals.user.auth0_sub],
      );
      await organizationsManagement.addMembers(organizationId, [
        context.locals.user.auth0_sub,
      ]);

      // setup admin role
      const roleAdminId = isProd()
        ? AUTH0_ROLE_ADMIN_PROD
        : AUTH0_ROLE_ADMIN_DEV;
      await organizationsManagement.addMemberRoles(
        organizationId,
        context.locals.user.auth0_sub,
        [roleAdminId],
      );

      return transformRawData({
        id: organizationId,
      });
    },
  }),
  setupTenantData: defineAction({
    input: TenantInputParamsSchema,
    handler: async (input, context) => {
      // Clone the tenant
      const transcriptionTypes = getTranscriptionTypes(input.add_ons ?? []);
      const newTenant = await TenantModel.copyTenant(masterTenantId, {
        name: input.name,
        org_id: input.org_id,
        org_name: input.org_name,
        billing_info: input.billing,
        transcription_types: transcriptionTypes,
        default_language: input.language,
      });

      // Update the current tenant for the logged-in user
      const { id: userId } = context.locals.user;
      const newRoles = [UserRole.Admin];
      await UserModel.update(userId, {
        tenant_id: newTenant.insertedId,
        roles: newRoles,
        permissions: assignPermissions(newRoles),
        logins_count: 0,
      });
      await UserModel.addTour(userId, {
        type: TourType.OnboardingNewTenant,
        active: true,
      });

      // Find all categories for the original tenant
      const selectedCategoryIds = input.use_cases.map(
        (categoryId) => new ObjectId(categoryId),
      );
      const categoryCursor = await CategoryModel.listByTenantAndIds(
        masterTenantId,
        selectedCategoryIds,
      );
      const categories = await categoryCursor.toArray();

      // Clone each category and store mapping
      const categoryIdMap = new Map();
      const groupIdMap = new Map();
      for (const category of categories) {
        // Clone each group and store mapping
        const newGroups: Group[] = [];
        for (const group of category.groups) {
          const newGroupId = new ObjectId();
          newGroups.push({
            ...group,
            _id: newGroupId,
          });
          groupIdMap.set(group._id?.toString(), newGroupId);
        }

        const newCategory: Category = {
          ...category,
          title: category.title,
          tenant_id: newTenant.insertedId,
          groups: newGroups,
          created_at: new Date(),
          updated_at: new Date(),
        };

        const { insertedId: newCatId } = await CategoryModel.add(newCategory);
        categoryIdMap.set(category._id.toString(), newCatId);
      }

      // Clone prompts with updated categoryId
      const originalCategoryIds = categories.map((c) => c._id);
      const promptCursor =
        await PromptModel.listByCategoryIds(originalCategoryIds);
      const prompts = await promptCursor.toArray();

      const newPrompts = prompts.map((prompt: Prompt) => ({
        ...prompt,
        tenant_id: newTenant.insertedId,
        category: categoryIdMap.get(prompt.category?.toString()),
        group: groupIdMap.get(prompt.group?.toString()),
        documents: [],
        created_at: new Date(),
        updated_at: new Date(),
      }));

      console.log("Prompt Categories:", categoryIdMap);
      console.log("Prompt Groups:", groupIdMap);
      if (newPrompts.length > 0) {
        await PromptModel.insertMultiple(newPrompts);
      }

      // Find all audio transcriptions for the original tenant
      const transcriptions = await TranscriptionModel.listByTenantAndCategories(
        masterTenantId,
        transcriptionTypes,
      );
      const newTranscriptions = transcriptions.map(
        (transcription: Transcription) => ({
          ...transcription,
          _id: new ObjectId(),
          tenant_id: newTenant.insertedId,
          created_at: new Date(),
          updated_at: new Date(),
        }),
      );
      if (newTranscriptions.length > 0) {
        await TranscriptionModel.insertMultiple(newTranscriptions);
      }

      // Create tenant subscription
      const subscription: Partial<Omit<Subscription, "_id">> = {
        tenant_id: newTenant.insertedId,
        plan_name: input.plan_name,
        add_ons: input.add_ons,
      };
      await SubscriptionModel.create(subscription);

      const data = {
        id: newTenant.insertedId,
      };

      return transformRawData(data);
    },
  }),
  finalize: defineAction({
    input: TenantEmailInputParamsSchema,
    handler: async (input, context) => {
      const { tenant_id: tenantId } = input;
      const email = context.locals.user.email;
      const tenant = await TenantModel.get(tenantId);
      const subscription = await SubscriptionModel.findByTenant(tenantId);

      if (!tenant) {
        throw new Error("Tenant not found.");
      }

      const addOnsStr = subscription?.add_ons
        ?.map((name: AudioOptionId) => {
          return AudioOptionLabels[name];
        })
        .join(", ");

      // send notification email to aibox-support
      const subjectPrefix = isProd() ? "aibox" : "aibox-dev";
      const emailSubject = `${subjectPrefix} - New onboarding`;
      const emailContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1><b>New Onboarding Notification</b></h1>
          <p><b>Organization ID:</b> ${tenant.org_id}</p>
          <p><b>Organization Name:</b> ${tenant.name}</p>
          <br/><br/>
          <h4>Subscription</h4>
          <p><b>${subscription?.plan_name ?? "-"}</b></p>
          <p>${addOnsStr}</p>
          <br/><br/>
          <h4>Billing</h4>
          <p><b>Company name:</b> ${tenant.billing_info?.company_name ?? "-"}</p>
          <p><b>Address:</b> ${tenant.billing_info?.address ?? "-"}</p>
          <p><b>Zip code:</b> ${tenant.billing_info?.zip_code ?? "-"}</p>
          <p><b>Location:</b> ${tenant.billing_info?.location ?? "-"}</p>
          <p><b>Email:</b> ${tenant.billing_info?.email ?? "-"}</p>
        </div>
      `;
      await sendMail({
        from: {
          name: "AI now AG",
          email: "no-reply@ainow.ch",
        },
        to: "support@aibox-app.ch",
        subject: emailSubject,
        html: emailContent,
      });

      // send verification email to admin user
      await sendMail({
        from: {
          name: "AI now AG",
          email: "no-reply@ainow.ch",
        },
        to: email,
        templateId: SG_NEW_TENANT_TEMPLATE,
        dynamicTemplateData: {},
      });

      return transformRawData({
        success: true,
      });
    },
  }),
};
