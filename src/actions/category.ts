import { defineAction } from "astro:actions";
import { z } from "zod";
import { transformRawData } from "$utils/transformRawData";
import CategoryModel, { type Category } from "$data/models/category.model";

const CategoryInputIdentifierSchema = z.object({
  _id: z.string(),
});

const CategoryInputListIdentifierSchema = z.array(
  z.object({
    _id: z.string(),
  }),
);

const CategoryItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  active: z.boolean().optional(),
});

export const ViewCategorySchema = z.object({
  updated: z.boolean(),
  items: z.array(CategoryItemSchema),
});

export type ViewCategory = z.infer<typeof CategoryItemSchema>;

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
          const updateResult = await CategoryModel.findAndUpdate(item._id, {
            position: index,
          });
          items.push(transformRawData(updateResult));
          updated = true;
        } else {
          items.push(transformRawData(currentItem));
        }
      }
      return { updated, items };
    },
  }),
};
