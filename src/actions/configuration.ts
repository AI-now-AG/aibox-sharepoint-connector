import { defineAction } from "astro:actions";
import { z } from "zod";
import configurationModel from "$data/models/configuration.model";

const instructionSchema = z.object({
  en: z.string(),
  de: z.string(),
});

const modelInstructionSchema = z.record(
  z.string(), // Model Name
  z.object({
    instruction: instructionSchema,
  }),
);

const providerInstructionSchema = z.object({
  provider: z.string(),
  instruction: instructionSchema,
  model: modelInstructionSchema.optional(),
});

export const ConfigurationSchema = z.object({
  defaultInstructions: z.array(providerInstructionSchema),
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
