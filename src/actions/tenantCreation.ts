import { defineAction } from "astro:actions";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { transformRawData } from "$utils/transformRawData";
import TenantModel from "$data/models/tenant.model";
import CategoryModel, {
  type Category,
  type Group,
} from "$data/models/category.model";
import PromptModel from "$data/models/prompt.model";
import GlobalCategoryModel from "$data/models/globalCategory.model";
import GlobalPromptModel from "$data/models/globalPrompt.model";
import SubscriptionModel, {
  type Subscription,
} from "$data/models/subscription.model";
import TranscriptionModel, {
  type Transcription,
} from "$data/models/transcription.model";
import KnowledgeBaseModel from "$data/models/knowledgeBase.model";
import {
  SubscriptionPackageId,
  AudioOptionId,
  AudioOptionLabels,
  SubscriptionIncludedUsers,
  SubscriptionIncludedKbMB,
  BillingMethod,
  CountryCode,
  BillingMethodLabels,
} from "$types/Subscription";
import { TenantFeature, ThemeCode } from "$types/TenantFeature";
import organizationsManagement from "$data/auth0/organizations-manager";
import sendMail from "$utils/mail";
import { isProd } from "$utils/env";
import { randomString } from "$utils/common";
import { getTranscriptionTypes, hasSubtitleEditor } from "$utils/onboarding";
import { TENANT_MASTER_ID } from "$constants";

const masterTenantId = isProd() ? TENANT_MASTER_ID.PROD : TENANT_MASTER_ID.DEV;

const OrganizationNameInputSchema = z.object({
  organization_name: z.string().min(1),
});

const BillingInfoInputSchema = z.object({
  company_name: z.string(),
  address: z.string(),
  zip_code: z.string(),
  location: z.string(),
  country: z.string().default(CountryCode.CH),
  email: z.string(),
});

const TenantConfignputSchema = z.object({
  is_reseller: z.boolean().default(false),
  reseller_code: z.string().nullish(),
  is_somedia: z.boolean().default(false),
});

const TenantInputParamsSchema = z.object({
  name: z.string().min(1),
  org_id: z.string().min(1),
  org_name: z.string().min(1),
  language: z.string().min(1),
  theme: z.nativeEnum(ThemeCode).default(ThemeCode.AIBox),
  website: z.string().optional(),
  plan_name: z.nativeEnum(SubscriptionPackageId).optional(),
  add_ons: z.array(z.nativeEnum(AudioOptionId)).optional(),
  billing_method: z.nativeEnum(BillingMethod).optional(),
  use_cases: z.array(z.string()),
  totalPrice: z.string().optional(),
  billing_info: BillingInfoInputSchema,
});

const SetupKbInputSchema = z.object({
  tenant_id: z.string().min(1),
  company_name: z.string().min(1),
  content: z.string().min(1),
});

const FinalizeTenantInputSchema = z.object({
  tenant_id: z.string().min(1),
  template: z.string().optional(),
});

// step 1: createOrganization()  - Create Auth0 organization
// step 2: initializeTenant() - Clone tenant, override configs & import categories / prompts
// step 3: finalizeOnboarding()  - Send notification emails

export const tenantCreation = {
  createOrganization: defineAction({
    input: OrganizationNameInputSchema,
    handler: async (input) => {
      const { organization_name: organizationName } = input;
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

      return transformRawData(organizationResult.data);
    },
  }),
  initializeTenant: defineAction({
    input: z.object({
      tenant: TenantInputParamsSchema,
      config: TenantConfignputSchema,
    }),
    handler: async (input, context) => {
      const { tenant, config } = input;
      const isReseller = config.is_reseller || false;
      const resellerCode = config.reseller_code || null;
      const isSomedia = config.is_somedia || false;

      // Clone the tenant
      const transcriptionTypes = getTranscriptionTypes(tenant.add_ons ?? []);
      const masterTenant = await TenantModel.get(masterTenantId);

      let includedFeatures = masterTenant?.included_features ?? [];
      if (transcriptionTypes.length == 0) {
        includedFeatures = includedFeatures.filter((item) => {
          return item.name !== TenantFeature.AudioToText;
        });
      }
      // Subtitle Studio is active if AudioPremium is selected (includes subtitle features)
      const subtitleStudioActive = hasSubtitleEditor(tenant.add_ons ?? []);
      const includedUserLimit =
        SubscriptionIncludedUsers[tenant.plan_name as SubscriptionPackageId] ||
        10;
      const includedKbMB =
        SubscriptionIncludedKbMB[tenant.plan_name as SubscriptionPackageId] ||
        10;

      const newTenant = await TenantModel.copyTenant(masterTenantId, {
        name: tenant.name,
        org_id: tenant.org_id,
        org_name: tenant.org_name,
        billing_method: isSomedia
          ? BillingMethod.YearlyInvoice
          : tenant.billing_method,
        billing_info: tenant.billing_info,
        default_language: tenant.language,
        theme: isSomedia ? ThemeCode.SomediaAssistant : tenant.theme,
        website: tenant.website,
        included_features: includedFeatures,
        transcription_types: transcriptionTypes,
        audio_assistant_active: true,
        subtitle_studio_active: subtitleStudioActive,
        totalPrice: tenant.totalPrice,
        is_internal: false,
        owned_by_reseller: isReseller ? resellerCode : null,
        included_user_limit: includedUserLimit, // default included users
        vector_kb_enabled: true,
        vector_kb_max_storage_mb: includedKbMB,
      });

      // Find all categories for the original tenant
      const selectedCategoryIds = tenant.use_cases.map(
        (categoryId) => new ObjectId(categoryId),
      );
      const categories =
        await GlobalCategoryModel.listByIds(selectedCategoryIds);

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
      const prompts =
        await GlobalPromptModel.listByCategoryIds(originalCategoryIds);

      const newPrompts = prompts.map((prompt) => ({
        ...prompt,
        tenant_id: newTenant.insertedId,
        category: categoryIdMap.get(prompt.category?.toString()),
        group: groupIdMap.get(prompt.group?.toString()),
        documents: [],
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

      const { id: userId } = context.locals.user;
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
        plan_name: tenant.plan_name,
        add_ons: tenant.add_ons,
        // For Somedia, we start with a subscription that has no trial
        ...(isSomedia && {
          start_date: new Date(),
        }),
        // For non-Somedia and normal case, we start with a trial
        ...(!isSomedia && {
          is_trial: true,
          trial_start_date: new Date(),
        }),
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
      const { tenant_id: tenantId, company_name: companyName, content } = input;

      // Create KB entry for the new tenant
      const tenantObjectId = new ObjectId(tenantId);
      const { insertedId } = await KnowledgeBaseModel.add({
        tenant_id: tenantObjectId,
        title: `Über ${companyName}`,
        description: `Auto-generated knowledge base about ${companyName}`,
        knowledge_base: content,
        updated_at: new Date(),
        created_at: new Date(),
      });

      // Assign the new KB to all prompts of this tenant
      await PromptModel.addKbToTenantPrompts(tenantObjectId, insertedId);

      return transformRawData({
        success: true,
        knowledgeBaseId: insertedId,
      });
    },
  }),
  completeTenantSetup: defineAction({
    input: FinalizeTenantInputSchema,
    handler: async (input, context) => {
      const { tenant_id: tenantId, template } = input;
      const isReseller = context.locals.tenant?.is_reseller ?? false;
      const email = context.locals.user.email;
      const tenantName = context.locals.tenant.name;

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
              <strong>Template:</strong> ${template} <br/> 
              <strong>Billing:</strong> ${BillingMethodLabels[tenant.billing_method as BillingMethod] ?? "-"}
            </p>

            <p>
              <strong>Company details:</strong> <br/>
              ${tenant.billing_info?.company_name ?? "-"} <br/>
              ${tenant.billing_info?.address ?? "-"}<br/>
              ${tenant.billing_info?.zip_code ?? "-"} ${tenant.billing_info?.location ?? "-"}
            </p>

            <p>
              <strong>Contact:</strong> ${tenant.billing_info?.email ?? "-"}<br/>
              <strong>Website:</strong> ${tenant?.website ?? "-"}<br/>
              <strong>Created:</strong> ${new Date().toLocaleDateString()}<br/>
              <strong>Account created by:</strong> ${email}<br/>
              <strong>Flow:</strong> ${isReseller ? "Reseller" : "Internal"}<br/>
              ${isReseller ? `<strong>Reseller:</strong> ${tenantName}` : ""}
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

      return transformRawData({
        success: true,
      });
    },
  }),
};
