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
import PromptModel from "$data/models/prompt.model";
import GlobalCategoryModel from "$data/models/globalCategory.model";
import GlobalPromptModel from "$data/models/globalPrompt.model";
import KnowledgeBaseModel from "$data/models/knowledgeBase.model";
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
  SubscriptionIncludedUsers,
  SubscriptionIncludedKbMB,
  BillingMethod,
  BillingMethodLabels,
} from "$types/Subscription";
import { UserRole, TourType } from "$types/Users";
import { TenantFeature } from "$types/TenantFeature";
import { SocialProvider } from "$types/Auth0Auth";
import organizationsManagement from "$data/auth0/organizations-manager";
import sendMail from "$utils/mail";
import { isProd } from "$utils/env";
import { randomString } from "$utils/common";
import { isSocialConnection } from "$utils/auth0";
import {} from "$utils/stripe";
import { getTranscriptionTypes } from "$utils/onboarding";
import {
  TENANT_MASTER_ID,
  SG_NEW_TENANT_TEMPLATE,
  AUTH0_ROLE_ADMIN,
  AUTH0_AUTH_WINDOWS_CON,
  AUTH0_AUTH_GOOGLE_CON,
} from "$constants";

const masterTenantId = isProd() ? TENANT_MASTER_ID.PROD : TENANT_MASTER_ID.DEV;
const auth0GoogleCon = isProd()
  ? AUTH0_AUTH_GOOGLE_CON.PROD
  : AUTH0_AUTH_GOOGLE_CON.DEV;
const auth0WindowsCon = isProd()
  ? AUTH0_AUTH_WINDOWS_CON.PROD
  : AUTH0_AUTH_WINDOWS_CON.DEV;

const OrganizationNameInputSchema = z.object({
  organization_name: z.string().min(1),
});

const OrganizationIdInputSchema = z.object({
  org_id: z.string().min(1),
});

const SetupTenantInputSchema = z.object({
  org_id: z.string().min(1),
  org_name: z.string().min(1),
});

const SetupKbInputSchema = z.object({
  tenant_id: z.string().min(1),
  org_name: z.string().min(1),
  content: z.string().min(1),
});

const ConfigureAssistantsInputSchema = z.object({
  tenant_id: z.string().min(1),
  tag_id: z.string().min(1),
  kb_id: z.string().optional(),
});

const FinalizeTenantInputSchema = z.object({
  tenant_id: z.string().min(1),
  tag_name: z.string().optional(),
});

export const onboarding = {
  createOrganization: defineAction({
    input: OrganizationNameInputSchema,
    handler: async (input, context) => {
      const { organization_name: organizationName } = input;
      const { user } = context.locals;
      const name = organizationName
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
        display_name: organizationName,
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
  assignUserToOrganization: defineAction({
    input: OrganizationIdInputSchema,
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
        ? AUTH0_ROLE_ADMIN.PROD
        : AUTH0_ROLE_ADMIN.DEV;
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
  initializeTenant: defineAction({
    input: SetupTenantInputSchema,
    handler: async (input, context) => {
      // Clone the tenant
      const transcriptionTypes = getTranscriptionTypes([
        AudioOptionId.AudioToText,
      ]);
      const masterTenant = await TenantModel.get(masterTenantId);

      let includedFeatures = masterTenant?.included_features ?? [];
      if (transcriptionTypes.length == 0) {
        includedFeatures = includedFeatures.filter((item) => {
          return item.name !== TenantFeature.AudioToText;
        });
      }
      const includedUserLimit =
        SubscriptionIncludedUsers[SubscriptionPackageId.Teams] || 10;
      const includedKbMB =
        SubscriptionIncludedKbMB[SubscriptionPackageId.Teams] || 10;
      const newTenant = await TenantModel.copyTenant(masterTenantId, {
        name: input.org_name,
        org_id: input.org_id,
        org_name: input.org_name,
        billing_method: BillingMethod.CreditCard,
        billing_info: {},
        included_features: includedFeatures,
        transcription_types: transcriptionTypes,
        default_language: "de",
        stripe_customer_id: null,
        audio_assistant_active: true,
        subtitle_studio_active: false,
        totalPrice: "",
        is_internal: false,
        included_user_limit: includedUserLimit, // default included users
        vector_kb_enabled: true,
        vector_kb_max_storage_mb: includedKbMB,
      });

      // Update the current tenant for the logged-in user
      const { id: userId } = context.locals.user;
      const newRoles = [UserRole.Admin];
      await UserModel.update(userId, {
        tenant_id: newTenant.insertedId,
        roles: newRoles,
        permissions: assignPermissions(newRoles),
        logins_count: 0,
        is_complete_self_registration: true,
      });
      await UserModel.addTour(userId, {
        type: TourType.OnboardingNewTenant,
        active: true,
      });

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
          user_id: userId,
          enabled: true,
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
        plan_name: SubscriptionPackageId.Teams,
        add_ons: [AudioOptionId.AudioToText],
        is_trial: true,
        trial_start_date: new Date(),
      };
      await SubscriptionModel.create(subscription);

      const data = {
        id: newTenant.insertedId,
      };

      return transformRawData(data);
    },
  }),
  createTenantKnowledgeBase: defineAction({
    input: SetupKbInputSchema,
    handler: async (input) => {
      const {
        tenant_id: tenantId,
        org_name: organizationName,
        content,
      } = input;

      // Create KB entry for the new tenant
      const tenantObjectId = new ObjectId(tenantId);
      const { acknowledged, insertedId } = await KnowledgeBaseModel.add({
        tenant_id: tenantObjectId,
        title: `Über ${organizationName}`,
        description: `Auto-generated knowledge base about ${organizationName}`,
        knowledge_base: content,
        updated_at: new Date(),
        created_at: new Date(),
      });

      return transformRawData({
        knowledgeBaseId: insertedId,
        insertedCount: acknowledged ? 1 : 0,
      });
    },
  }),
  configureAssistants: defineAction({
    input: ConfigureAssistantsInputSchema,
    handler: async (input) => {
      const { tenant_id: tenantId, tag_id: tagId, kb_id: kbId } = input;

      // Find all categories for the original tenant
      const categories = await GlobalCategoryModel.listByTag(tagId);

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
          tenant_id: new ObjectId(tenantId),
          groups: newGroups,
          created_at: new Date(),
          updated_at: new Date(),
        };

        const { insertedId: newCatId } = await CategoryModel.add(newCategory);
        categoryIdMap.set(category._id.toString(), newCatId);
      }

      // Clone prompts with updated categoryId
      const originalCategoryIds = categories.map((c) => c._id);
      const prompts =
        await GlobalPromptModel.listByCategoryIds(originalCategoryIds);

      const newPrompts = prompts.map((prompt) => ({
        ...prompt,
        tenant_id: new ObjectId(tenantId),
        category: categoryIdMap.get(prompt.category?.toString()),
        group: groupIdMap.get(prompt.group?.toString()),
        documents: [],
        ...(kbId && {
          knowledgebase: [new ObjectId(kbId)],
        }),
        created_at: new Date(),
        updated_at: new Date(),
        // Vector KB fields (no data cloned, start empty)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vector_kb_enabled: (prompt as any).vector_kb_enabled ?? false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vector_kb_scope: (prompt as any).vector_kb_scope ?? null,
        vector_kb_folder_ids: [],
        vector_kb_data_source_ids: [],
      }));

      console.log("Onboarding >> Prompt Categories:", categoryIdMap);
      console.log("Onboarding >> Prompt Groups:", groupIdMap);

      let insertedCount = 0;
      if (newPrompts.length > 0) {
        const insertResult = await PromptModel.insertMultiple(newPrompts);
        insertedCount = insertResult.insertedCount;
      }

      return transformRawData({
        insertedCount,
      });
    },
  }),
  finalizeOnboarding: defineAction({
    input: FinalizeTenantInputSchema,
    handler: async (input, context) => {
      const { tenant_id: tenantId, tag_name: tagName } = input;
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
      const subjectPrefix = isProd() ? "[aibox]" : "[aibox-dev]";
      const emailSubject = `${subjectPrefix} Tenant Created - ${tenant.name}`;
      const emailContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h3><strong>Tenant successfully created</strong></h3>
          <p>
            <strong>Organization Name:</strong> ${tenant.name}<br/> 
            <strong>Subscription:</strong> ${subscription?.plan_name ?? "-"}<br/> 
            ${addOnsStr ? `${addOnsStr}<br/>` : ""} 
            <strong>Template:</strong> ${tagName}<br/>
            <strong>Billing:</strong> ${BillingMethodLabels[tenant.billing_method as BillingMethod] ?? "-"}
          </p>

          <p>
            <strong>Company details:</strong> <br/>
            ${tenant.billing_info?.company_name ?? "-"} <br/>
            ${tenant.billing_info?.address ?? "-"} <br/>
            ${tenant.billing_info?.zip_code ?? "-"} ${tenant.billing_info?.zip_code ?? "-"} ${tenant.billing_info?.location ?? "-"}
          </p>

          <p>
            <strong>Contact:</strong> ${tenant.billing_info?.email ?? "-"}<br/>
            <strong>Created:</strong> ${new Date().toLocaleDateString()}<br/>
            <strong>Account created by:</strong> ${email}<br/>
            <strong>Flow:</strong>Self Onboarding
          </p>
        </div>
      `;
      await sendMail({
        from: {
          name: "AI now AG",
          email: "no-reply@ainow.ch",
        },
        to: "support@aibox-app.ch",
        //bcc: "devlin.nguyenb4you.ch@gmail.com",
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
