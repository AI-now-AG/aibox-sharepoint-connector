import { defineAction } from "astro:actions";
import { z } from "zod";
import { transformRawData } from "$utils/transformRawData";
import GlobalPromptModel, {
  type Prompt,
} from "$data/models/globalPrompt.model";

const PromptListIdentifierSchema = z.array(
  z.object({
    _id: z.string(),
  }),
);

export const globalPrompt = {
  updatePosition: defineAction({
    input: PromptListIdentifierSchema,
    handler: async (input) => {
      const items: Prompt[] = [];
      for (const [index, item] of input.entries()) {
        const updateResult = await GlobalPromptModel.update(item._id, {
          position: index,
        });
        items.push(updateResult as Prompt);
      }

      return transformRawData(items);
    },
  }),
};
