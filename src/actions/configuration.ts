import { defineAction } from "astro:actions";
import { z } from "zod";
import ConfigurationModel, {
  ProviderInstructionSchema,
} from "$data/models/configuration.model";

export const ConfigurationSchema = z.object({
  defaultInstructions: z.array(ProviderInstructionSchema),
});

const ConfigurationIdentifierSchema = z.object({
  _id: z.string(),
});

export const configurations = {
  update: defineAction({
    input: z.intersection(ConfigurationSchema, ConfigurationIdentifierSchema),
    handler: async (input) => {
      try {
        await ConfigurationModel.update(input._id, {
          defaultInstructions: input.defaultInstructions,
        });
        return { success: true };
      } catch (error) {
        console.error("Failed to update instructions:", error);
        return { success: false, error: "Database update failed." };
      }
    },
  }),
  get: defineAction({
    input: z.object({}),
    handler: async () => {
      const config = await ConfigurationModel.get();
      return config;
    },
  }),
};
