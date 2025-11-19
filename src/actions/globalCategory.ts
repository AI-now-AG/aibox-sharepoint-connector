import { defineAction } from "astro:actions";
import { z } from "zod";
import { transformRawData } from "$utils/transformRawData";
import GlobalCategoryModel, {
  type Category,
} from "$data/models/globalCategory.model";

const CategoryInputIdentifierSchema = z.object({
  _id: z.string(),
});

const CategoryInputListIdentifierSchema = z.array(
  z.object({
    _id: z.string(),
  }),
);

export const globalCategory = {
  activate: defineAction({
    input: CategoryInputIdentifierSchema,
    handler: async (input) => {
      const updateResult = await GlobalCategoryModel.update(input._id, {
        active: true,
      });
      return transformRawData(updateResult);
    },
  }),

  deactivate: defineAction({
    input: CategoryInputIdentifierSchema,
    handler: async (input) => {
      const updateResult = await GlobalCategoryModel.update(input._id, {
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
        const currentItem = await GlobalCategoryModel.get(item._id);

        if (currentItem && currentItem.position !== index) {
          const updateResult = await GlobalCategoryModel.update(item._id, {
            position: index,
          });
          items.push(updateResult as Category);
          updated = true;
        } else {
          items.push(currentItem as Category);
        }
      }

      console.log("input.entries()", input);
      console.log("items", { updated, items });

      return transformRawData({ updated, items });
    },
  }),
};
