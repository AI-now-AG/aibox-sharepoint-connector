import { defineAction } from "astro:actions";
import { z } from "zod";
import configurationModel from "$data/models/configuration.model";

const InstructionSchema = z.object({
  en: z.string(),
  de: z.string(),
});

const ModelInstructionSchema = z.record(
  z.string(), // Model Name
  z.object({
    instruction: InstructionSchema,
  }),
);

const ProviderInstructionSchema = z.object({
  provider: z.string(),
  instruction: InstructionSchema,
  models: ModelInstructionSchema.optional(),
});

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
        await configurationModel.update(input._id, {
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
      const config = await configurationModel.get();
      return config;
    },
  }),
};
