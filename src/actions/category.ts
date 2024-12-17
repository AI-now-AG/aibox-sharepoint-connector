import { defineAction } from "astro:actions";
import { z } from "zod";
import { transformRawData } from "$utils/transformRawData";
import categoryModel from "$data/models/category.model";

const CategoryInputIdentifierSchema = z.object({
  _id: z.string(),
});

export const category = {
  activate: defineAction({
    input: CategoryInputIdentifierSchema,
    handler: async (input) => {
      const updateResult = await categoryModel.update(input._id, {
        active: true,
      });
      return transformRawData(updateResult);
    },
  }),

  deactivate: defineAction({
    input: CategoryInputIdentifierSchema,
    handler: async (input) => {
      const updateResult = await categoryModel.update(input._id, {
        active: false,
      });
      return transformRawData(updateResult);
    },
  }),
};
