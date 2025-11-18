import { defineAction } from "astro:actions";
import { z } from "zod";
import { transformRawData } from "$utils/transformRawData";
import CategoryModel, { type Category } from "$data/models/category.model";

const CategoryInputIdentifierSchema = z.object({
  _id: z.string(),
});

const TenantIdentifierSchema = z.object({
  _id: z.string(),
});

const CategoryInputListIdentifierSchema = z.array(
  z.object({
    _id: z.string(),
  }),
);

export const category = {
  activate: defineAction({
    input: CategoryInputIdentifierSchema,
    handler: async (input) => {
      const updateResult = await CategoryModel.update(input._id, {
        active: true,
      });
      return transformRawData(updateResult);
    },
  }),

  listByTenant: defineAction({
    input: TenantIdentifierSchema,
    handler: async (input) => {
      const categoriesCursor = await CategoryModel.listByTenant(input._id);
      const categories = await categoriesCursor.toArray();
      return transformRawData(categories);
    },
  }),

  deactivate: defineAction({
    input: CategoryInputIdentifierSchema,
    handler: async (input) => {
      const updateResult = await CategoryModel.update(input._id, {
        active: false,
      });
      return transformRawData(updateResult);
    },
  }),

  updatePosition: defineAction({
    input: CategoryInputListIdentifierSchema,
    handler: async (input) => {
      let updated = false;
      const items: Category[] = [];

      for (const [index, item] of input.entries()) {
        const currentItem = await CategoryModel.get(item._id);

        if (currentItem && currentItem.position !== index) {
          const updateResult = await CategoryModel.update(item._id, {
            position: index,
          });
          items.push(updateResult as Category);
          updated = true;
        } else {
          items.push(currentItem as Category);
        }
      }

      return transformRawData({ updated, items });
    },
  }),
};
