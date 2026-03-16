import { defineAction } from "astro:actions";
import { z } from "zod";
import ConfigurationModel, {
  ProviderInstructionSchema,
} from "$data/models/configuration.model";

const CitationInstructionSchema = z.object({
  en: z.string(),
  de: z.string(),
});

export const ConfigurationSchema = z.object({
  defaultInstructions: z.array(ProviderInstructionSchema).optional(),
  promptRefinementInstruction: z.string().optional(),
  promptKbGenerationInstruction: z.string().optional(),
  selfOnboardingIndustryInstruction: z.string().optional(),
  citationInstruction: CitationInstructionSchema.optional(),
});

const ConfigurationIdentifierSchema = z.object({
  _id: z.string(),
});

export const configurations = {
  update: defineAction({
    input: z.intersection(ConfigurationSchema, ConfigurationIdentifierSchema),
    handler: async (input) => {
      try {
        const update: Record<string, unknown> = {};

        if (input.defaultInstructions !== undefined) {
          update.defaultInstructions = input.defaultInstructions;
        }
        if (input.promptRefinementInstruction !== undefined) {
          update.promptRefinementInstruction =
            input.promptRefinementInstruction;
        }
        if (input.citationInstruction !== undefined) {
          update.citationInstruction = input.citationInstruction;
        }
        if (input.promptKbGenerationInstruction !== undefined) {
          update.promptKbGenerationInstruction =
            input.promptKbGenerationInstruction;
        }
        if (input.selfOnboardingIndustryInstruction !== undefined) {
          update.selfOnboardingIndustryInstruction =
            input.selfOnboardingIndustryInstruction;
        }

        if (Object.keys(update).length === 0) {
          throw new Error("No valid fields to update.");
        }

        await ConfigurationModel.update(input._id, update);
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
