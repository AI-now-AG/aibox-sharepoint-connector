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
import {
  SubscriptionPackageId,
  AudioOptionId,
  SubscriptionIncludedUsers,
  SubscriptionIncludedKbMB,
  BillingMethod,
} from "$types/Subscription";
import KnowledgeBaseModel from "$data/models/knowledgeBase.model";
import { TenantFeature, ThemeCode } from "$types/TenantFeature";
import organizationsManagement from "$data/auth0/organizations-manager";
import { isProd } from "$utils/env";
import { randomString } from "$utils/common";
import { getTranscriptionTypes, hasSubtitleEditor } from "$utils/onboarding";
import { TENANT_MASTER_DEV, TENANT_MASTER_PROD } from "$constants";

const masterTenantId = isProd() ? TENANT_MASTER_PROD : TENANT_MASTER_DEV;

const OrganizationNameInputParamsSchema = z.object({
  organization_name: z.string().min(1),
});

const TenantInputParamsSchema = z.object({
  name: z.string().min(1),
  org_id: z.string().min(1),
  org_name: z.string().min(1),
  language: z.string().min(1),
  theme: z.nativeEnum(ThemeCode).default(ThemeCode.AIBox),
  plan_name: z.nativeEnum(SubscriptionPackageId).optional(),
  add_ons: z.array(z.nativeEnum(AudioOptionId)).optional(),
  use_cases: z.array(z.string()),
  totalPrice: z.string().optional(),
});

// step 1: createOrganization()  - Create Auth0 organization
// step 2: setupTenantData() - Clone tenant, override configs & import categories / prompts

export const cloneMasterTenant = {
  createOrganization: defineAction({
    input: OrganizationNameInputParamsSchema,
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
      const includedUserLimit =
        SubscriptionIncludedUsers[input.plan_name as SubscriptionPackageId] ||
        10;
      const includedKbMB =
        SubscriptionIncludedKbMB[input.plan_name as SubscriptionPackageId] ||
        10;
      const newTenant = await TenantModel.copyTenant(masterTenantId, {
        name: input.name,
        org_id: input.org_id,
        org_name: input.org_name,
        billing_method: BillingMethod.MonthlyInvoice,
        default_language: input.language,
        theme: input.theme,
        included_features: includedFeatures,
        transcription_types: transcriptionTypes,
        audio_assistant_active: true,
        subtitle_studio_active: subtitleStudioActive,
        totalPrice: input.totalPrice,
        included_user_limit: includedUserLimit, // default included users
        vector_kb_enabled: true,
        vector_kb_max_storage_mb: includedKbMB,
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

      // Clone regular KB entries from master tenant
      const kbIdMap = new Map<string, ObjectId>();
      try {
        const masterKbEntries = await KnowledgeBaseModel.listByTenant(
          new ObjectId(masterTenantId),
        );
        for (const kb of masterKbEntries) {
          const oldId = kb._id!.toString();
          const { insertedId: newKbId } = await KnowledgeBaseModel.add({
            ...kb,
            _id: undefined,
            tenant_id: newTenant.insertedId,
            created_at: new Date(),
            updated_at: new Date(),
          });
          kbIdMap.set(oldId, newKbId);
        }
        console.log(
          `[CloneMaster] Cloned ${masterKbEntries.length} regular KB entries`,
        );
      } catch (kbError) {
        console.error("[CloneMaster] Regular KB clone error:", kbError);
      }

      // Clone Vector KB data via backend endpoint
      const { id: userId } = context.locals.user;
      let folderIdMap: Record<string, string> = {};
      let dataSourceIdMap: Record<string, string> = {};
      try {
        const apiUrl =
          import.meta.env.TRANSCRIPTION_API_URL || "http://localhost:3005";
        const cloneResponse = await fetch(
          `${apiUrl}/api/vector-kb/clone-tenant`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sourceTenantId: masterTenantId,
              targetTenantId: newTenant.insertedId.toString(),
              userId,
            }),
          },
        );
        if (cloneResponse.ok) {
          const cloneResult = await cloneResponse.json();
          if (cloneResult.success) {
            folderIdMap = cloneResult.data.folderIdMap || {};
            dataSourceIdMap = cloneResult.data.dataSourceIdMap || {};
            console.log(
              `[CloneMaster] Vector KB cloned: ${cloneResult.data.stats?.folders} folders, ${cloneResult.data.stats?.dataSources} data sources, ${cloneResult.data.stats?.chunks} chunks`,
            );
          }
        } else {
          console.error(
            "[CloneMaster] Vector KB clone failed:",
            cloneResponse.status,
            await cloneResponse.text(),
          );
        }
      } catch (vectorKbError) {
        console.error("[CloneMaster] Vector KB clone error:", vectorKbError);
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
        // Regular KB: map IDs via kbIdMap
        knowledgebase: ((prompt as any).knowledgebase ?? [])
          .map((id: ObjectId) => kbIdMap.get(id.toString()))
          .filter(Boolean),
        // Vector KB fields: map IDs via folderIdMap / dataSourceIdMap
        vector_kb_enabled: (prompt as any).vector_kb_enabled ?? false,
        vector_kb_scope: (prompt as any).vector_kb_scope ?? null,
        vector_kb_folder_ids: ((prompt as any).vector_kb_folder_ids ?? [])
          .map((id: ObjectId) => {
            const mapped = folderIdMap[id.toString()];
            return mapped ? new ObjectId(mapped) : null;
          })
          .filter(Boolean),
        vector_kb_data_source_ids: (
          (prompt as any).vector_kb_data_source_ids ?? []
        )
          .map((id: ObjectId) => {
            const mapped = dataSourceIdMap[id.toString()];
            return mapped ? new ObjectId(mapped) : null;
          })
          .filter(Boolean),
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
};
