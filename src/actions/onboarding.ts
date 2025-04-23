import { defineAction } from "astro:actions";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { transformRawData } from "$utils/transformRawData";
import UserModel from "$data/models/user.model";
import TenantModel from "$data/models/tenant.model";
import CategoryModel, {
  type Category,
  type Group,
} from "$data/models/category.model";
import PromptModel, { type Prompt } from "$data/models/prompt.model";
import SubscriptionModel, {
  type Subscription,
} from "$data/models/subscription.model";
import {
  SubscriptionPackageId,
  AudioOptionId,
  AddOnsLabels,
  SubscriptionStatus,
} from "$types/Subscription";
import { AudioCategory } from "$types/TenantFeature";
import organizationsManagement from "$data/auth0/organizations-manager";
import sendMail from "$utils/mail";
import { isProd } from "$utils/env";
import {
  TENANT_MASTER_DEV,
  TENANT_MASTER_PROD,
  SG_ONBOARDING_TEMPLATE,
} from "$constants";

const originalTenantId = isProd() ? TENANT_MASTER_PROD : TENANT_MASTER_DEV;
const Auth0InputParamsSchema = z.object({
  company_name: z.string().min(1),
});
const TenantInputParamsSchema = z.object({
  name: z.string().min(1),
  org_id: z.string().min(1),
  org_name: z.string().min(1),
  plan_name: z.nativeEnum(SubscriptionPackageId).optional(),
  add_ons: z.array(z.nativeEnum(AudioOptionId)).optional(),
  billing: z.object({
    address: z.string(),
    zip_code: z.string(),
    location: z.string(),
    email: z.string(),
  }),
  use_cases: z.array(z.string()),
});
const EmailInputParamsSchema = z.object({
  tenant_id: z.string().min(1),
  email: z.string().min(1),
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

// step 1: setupAuth0()  - Create Auth0 org + move user from old org to new org
// step 2: setupTenant() - Clone tenant & import categories / prompts
// step 3: sendEmails()  - Send notification emails

export const onboarding = {
  setupAuth0: defineAction({
    input: Auth0InputParamsSchema,
    handler: async (input, context) => {
      const { company_name: companyName } = input;
      const name = companyName
        .toLowerCase()
        .normalize("NFKD") // Remove accents/diacritics
        .replace(/[\u0300-\u036f]/g, "") // Strip combining characters
        .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphen
        .replace(/^-+|-+$/g, "") // Trim leading/trailing hyphens
        .replace(/-{2,}/g, "-"); // Collapse multiple hyphens

      // create new Auth0 organization
      const organizationResult = await organizationsManagement.create({
        name: name,
        display_name: companyName,
      });

      const organizationId = organizationResult.data.id;

      // enable connection
      await organizationsManagement.addEnabledConnection(
        organizationId,
        import.meta.env.AUTH0_AUTH_CON_ID || "con_RXTD1LIbXJgceOUH",
      );

      // delete current user in trial organization
      // move current user to new organization
      await organizationsManagement.deleteMembers(
        context.locals.tenant.org_id,
        [context.locals.user.auth0_sub],
      );
      await organizationsManagement.addMembers(organizationId, [
        context.locals.user.auth0_sub,
      ]);

      return transformRawData(organizationResult.data);
    },
  }),
  setupTenant: defineAction({
    input: TenantInputParamsSchema,
    handler: async (input, context) => {
      // Clone the tenant
      const transcriptionTypes = getTranscriptionTypes(input.add_ons ?? []);
      const newTenant = await TenantModel.copyTenant(originalTenantId, {
        name: input.name,
        org_id: input.org_id,
        org_name: input.org_name,
        billing_info: input.billing,
        transcription_types: transcriptionTypes,
      });

      // Update the current tenant for the logged-in user
      await UserModel.update(context.locals.user.id, {
        tenant_id: new ObjectId(input.org_id),
      });

      // Find all categories for the original tenant
      const selectedCategoryIds = input.use_cases.map(
        (categoryId) => new ObjectId(categoryId),
      );
      const categoryCursor = await CategoryModel.listByTenantAndIds(
        originalTenantId,
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
            ...{
              _id: newGroupId,
            },
          });
          groupIdMap.set(group._id?.toString(), newGroupId);
        }

        const newCategory: Category = {
          ...category,
          ...{
            title: category.title,
            tenant_id: newTenant.insertedId,
            groups: newGroups,
            created_at: new Date(),
            updated_at: new Date(),
          },
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
        ...{
          category: categoryIdMap.get(prompt.category),
          group: groupIdMap.get(prompt.group),
        },
      }));

      if (newPrompts.length > 0) {
        await PromptModel.insertMultiple(newPrompts);
      }

      // Create tenant subscription
      const subAddOns = input.add_ons?.map((name) => {
        return {
          name,
          title: AddOnsLabels[name],
        };
      });
      const subscription: Partial<Omit<Subscription, "_id">> = {
        tenant_id: newTenant.insertedId,
        plan_name: input.plan_name,
        status: SubscriptionStatus.Active,
        add_ons: subAddOns,
      };
      await SubscriptionModel.create(subscription);

      const data = {
        tenant: newTenant,
      };

      return transformRawData(data);
    },
  }),
  sendEmails: defineAction({
    input: EmailInputParamsSchema,
    handler: async (input) => {
      const { tenant_id: tenantId, email } = input;
      const tenant = await TenantModel.get(tenantId);

      if (!tenant) {
        throw new Error("Tenant not found.");
      }

      // send notification email to aibox-support
      const subjectPrefix = isProd() ? "aibox" : "aibox-dev";
      const emailSubject = `${subjectPrefix} - New onboarding`;
      const emailContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1><b>New Onboarding Notification</b></h1>
          <p><b>Org ID:</b> ${tenant.org_id}</p>
          <p><b>Org Name:</b> ${tenant.org_name}</p>
          <p><b>Display name:</b> ${tenant.name}</p>
          <p><b>Billing address:</b> ${tenant.billing_info?.address}</p>
          <p><b>Billing email:</b> ${tenant.billing_info?.email}</p>
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
        templateId: SG_ONBOARDING_TEMPLATE,
        dynamicTemplateData: {},
      });

      return transformRawData({
        success: true,
      });
    },
  }),
};
