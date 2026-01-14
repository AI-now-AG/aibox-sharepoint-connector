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
import GlobalCategoryModel from "$data/models/globalCategory.model";
import GlobalPromptModel from "$data/models/globalPrompt.model";
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
  BillingMethod,
  type ProductKeys,
  CountryCode,
} from "$types/Subscription";
import { UserRole, TourType } from "$types/Users";
import { TenantFeature } from "$types/TenantFeature";
import { SocialProvider } from "$types/Auth0Auth";
import organizationsManagement from "$data/auth0/organizations-manager";
import sendMail from "$utils/mail";
import { isProd } from "$utils/env";
import { randomString } from "$utils/common";
import { isSocialConnection } from "$utils/auth0";
import {
  createCustomer,
  updateCustomer,
  getCustomerByEmail,
  createCheckoutSession,
} from "$utils/stripe";
import {
  getTranscriptionTypes,
  hasSubtitleEditor,
  getStripePrices,
  getStripeTaxRate,
} from "$utils/onboarding";
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
import type Stripe from "stripe";

const masterTenantId = isProd() ? TENANT_MASTER_PROD : TENANT_MASTER_DEV;
const auth0GoogleCon = isProd()
  ? AUTH0_AUTH_GOOGLE_CON_PROD
  : AUTH0_AUTH_GOOGLE_CON_DEV;
const auth0WindowsCon = isProd()
  ? AUTH0_AUTH_WINDOWS_CON_PROD
  : AUTH0_AUTH_WINDOWS_CON_DEV;

const OrganizationNameInputParamsSchema = z.object({
  organization_name: z.string().min(1),
});

const BillingInfoParamsSchema = z.object({
  company_name: z.string(),
  address: z.string(),
  zip_code: z.string(),
  location: z.string(),
  country: z.string().default(CountryCode.CH),
  email: z.string(),
});

const CheckoutInputParamsSchema = z.object({
  plan_name: z.nativeEnum(SubscriptionPackageId).optional(),
  add_ons: z.array(z.nativeEnum(AudioOptionId)).optional(),
  billing_info: BillingInfoParamsSchema,
  language: z.string().optional().default("en"),
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
  billing_method: z.nativeEnum(BillingMethod).optional(),
  billing_info: BillingInfoParamsSchema,
  use_cases: z.array(z.string()),
  stripe_customer_id: z.string().optional(),
  totalPrice: z.string().optional(),
});
const TenantEmailInputParamsSchema = z.object({
  tenant_id: z.string().min(1),
});

// step 1: createOrganization()  - Create Auth0 organization
// step 2: createMember()  - Create Auth0 user, move user from trial org to new org
// step 3: setupTenantData() - Clone tenant & import categories / prompts
// step 4: finalize()  - Send notification emails

export const onboarding = {
  createStripeSession: defineAction({
    input: CheckoutInputParamsSchema,
    handler: async (input, context) => {
      try {
        const { request } = context;
        const { user } = context.locals;
        const {
          plan_name: planName,
          add_ons: addOns,
          billing_info: billingInfo,
          language,
        } = input;
        const { default_language: defaultLanguage } = context.locals.tenant;

        const selectedPackages = [
          planName as ProductKeys,
          ...(addOns as ProductKeys[]),
        ];
        const priceIds = getStripePrices(selectedPackages);

        // Get the `Host` header (domain)
        const host = request.headers.get("host");

        // Get the protocol, typically 'https' in production
        const protocol = request.headers.get("x-forwarded-proto") || "https"; // Default to 'https' if not available

        // Combine protocol and host to form the full URL
        const fullDomain = `${protocol}://${host}`;

        if (!priceIds.length) {
          throw new Error("Product prices are required.");
        }

        // Generate dynamic success URL with user-specific data
        const successUrl = `${fullDomain}/subscription/step4?referer=stripe`;
        const cancelUrl = `${fullDomain}/subscription?referer=stripe`;

        // Lookup customer by email
        let stripeCustomerId = null;
        const customerEmail = user.email; // billingInfo.email
        const existingCustomer = await getCustomerByEmail(customerEmail);

        // Define common data for creation and update
        const customerData = {
          name: billingInfo.company_name,
          address: {
            line1: billingInfo.address,
            city: billingInfo.location,
            postal_code: billingInfo.zip_code,
            country: billingInfo.country,
          },
          preferred_locales: [language],
        };

        // Create new customer if not found
        if (!existingCustomer) {
          const newCustomer = await createCustomer({
            email: customerEmail,
            ...customerData,
          });
          stripeCustomerId = newCustomer?.id;
        } else {
          // Update existing customer
          updateCustomer(existingCustomer.id, customerData);
          stripeCustomerId = existingCustomer.id;
        }

        const taxtRate = getStripeTaxRate();
        const session = await createCheckoutSession({
          mode: "subscription",
          line_items: priceIds.map((id: string) => ({
            price: id,
            quantity: 1,
            tax_rates: [taxtRate],
          })),
          locale:
            (defaultLanguage as Stripe.Checkout.SessionCreateParams.Locale) ||
            "auto",
          //automatic_tax: { enabled: true }, // Enable automatic tax calculation
          customer: stripeCustomerId,
          success_url: successUrl,
          cancel_url: cancelUrl,
          subscription_data: {
            trial_period_days: 14,
          },
        });

        return { url: session?.url, stripeCustomerId };
      } catch (error) {
        console.error("Stripe checkout error:", error);
        throw error;
      }
    },
  }),
  createOrganization: defineAction({
    input: OrganizationNameInputParamsSchema,
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
      const masterTenant = await TenantModel.get(masterTenantId);

      let includedFeatures = masterTenant?.included_features ?? [];
      if (transcriptionTypes.length == 0) {
        includedFeatures = includedFeatures.filter((item) => {
          return item.name !== TenantFeature.AudioToText;
        });
      }
      // Subtitle Studio is active if AudioPremium is selected (includes subtitle features)
      const subtitleStudioActive = hasSubtitleEditor(input.add_ons ?? []);
      const newTenant = await TenantModel.copyTenant(masterTenantId, {
        name: input.name,
        org_id: input.org_id,
        org_name: input.org_name,
        billing_method: input.billing_method,
        billing_info: input.billing_info,
        included_features: includedFeatures,
        transcription_types: transcriptionTypes,
        default_language: input.language,
        stripe_customer_id: input.stripe_customer_id,
        audio_assistant_active: true,
        subtitle_studio_active: subtitleStudioActive,
        totalPrice: "",
      });

      // Update the current tenant for the logged-in user
      const { id: userId } = context.locals.user;
      const newRoles = [UserRole.Admin];
      await UserModel.update(userId, {
        tenant_id: newTenant.insertedId,
        roles: newRoles,
        permissions: assignPermissions(newRoles),
        logins_count: 0,
        created_by_admin: null,
        is_complete_self_registration: true,
      });
      await UserModel.addTour(userId, {
        type: TourType.OnboardingNewTenant,
        active: true,
      });

      // Find all categories for the original tenant
      const selectedCategoryIds = input.use_cases.map(
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
        // Vector KB fields (preserve from source or use defaults)
        vector_kb_enabled: (prompt as any).vector_kb_enabled ?? false,
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
