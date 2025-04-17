import { defineAction } from "astro:actions";
import { z } from "zod";
import { transformRawData } from "$utils/transformRawData";
import TenantModel from "$data/models/tenant.model";
import CategoryModel, {
  type Category,
  type Group,
} from "$data/models/category.model";
import PromptModel, { type Prompt } from "$data/models/prompt.model";
import { PlanName, AddOnsName } from "$types/Subscription";
import { ObjectId } from "mongodb";

const originalTenantId = "67ff572260fa2a8bca5d26d0";
const OnboardingInputParamsSchema = z.object({
  plan_name: z.nativeEnum(PlanName).optional(),
  add_ons: z.nativeEnum(AddOnsName).optional(),
  billing: z.object({
    company_name: z.string(),
    street: z.string(),
    zip_code: z.string(),
    location: z.string(),
    email: z.string(),
  }),
  use_cases: z.array(
    z.object({
      _id: z.string(),
    }),
  ),
});

export const user = {
  submit: defineAction({
    input: OnboardingInputParamsSchema,
    handler: async (input) => {
      // Clone the tenant
      const newTenant = await TenantModel.copyTenant(originalTenantId, {
        name: input.billing.company_name,
      });

      // Find all categories for the original tenant
      const categoryCursor =
        await CategoryModel.listActiveByTenant(originalTenantId);
      const categories = await categoryCursor.toArray();

      // Clone each category and store mapping
      const categoryIdMap = new Map();
      const groupIdMap = new Map();
      for (const category of categories) {
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

      const data = {
        tenant: newTenant,
      };

      return transformRawData(data);
    },
  }),
};
