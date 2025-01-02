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
      const items: Category[] = [];
      for (const [index, item] of input.entries()) {
        const updateResult = await CategoryModel.update(item._id, {
          position: index,
        });
        items.push(transformRawData(updateResult));
      }
      return items;
    },
  }),
};
