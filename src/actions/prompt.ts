import { defineAction } from "astro:actions";
import { z } from "zod";
import { transformRawData } from "$utils/transformRawData";
import promptModel, { type Prompt } from "$data/models/prompt.model";

const PromptListIdentifierSchema = z.array(
  z.object({
    _id: z.string(),
  }),
);

export const prompt = {
  updatePosition: defineAction({
    input: PromptListIdentifierSchema,
    handler: async (input) => {
      const items: Prompt[] = [];
      for (const [index, item] of input.entries()) {
        const updateResult = await promptModel.findAndUpdate(item._id, {
          position: index,
        });
        items.push(transformRawData(updateResult));
      }
      return items;
    },
  }),
};
