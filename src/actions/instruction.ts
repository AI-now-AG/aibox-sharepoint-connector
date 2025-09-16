import { defineAction } from "astro:actions";
import { z } from "zod";
import { transformRawData } from "$utils/transformRawData";
import InstructionModel, {
  InstructionsSchema,
  type InstructionType,
  type Instruction,
} from "$data/models/instruction.model";
import { ApiKeyProvider } from "$types/TenantFeature";
import { ObjectId } from "mongodb";

const InstructionInputParamsSchema = z.array(
  z.object({
    _id: z.string().min(1),
    instructions: InstructionsSchema,
  }),
);

// Allowed providers + models
const allowedModels = [
  {
    provider: ApiKeyProvider.OpenAI,
    models: ["gpt-4o", "gpt-5"],
  },
  {
    provider: ApiKeyProvider.AzureOpenAI,
    models: ["gpt-4o"],
  },
  {
    provider: ApiKeyProvider.Perplexity,
    models: ["sonar"],
  },
  {
    provider: ApiKeyProvider.Claude,
    models: ["claude-sonnet-4-0"],
  },
  {
    provider: ApiKeyProvider.Gemini,
    models: ["gemini-2.5-flash"],
  },
];
const allowedTypes = ["home", "knowledge_base"] as const;

// Helper → fetch or create fallback
async function fetchOrCreateInstruction(query: {
  provider?: ApiKeyProvider;
  model?: string | null;
  type: InstructionType;
}): Promise<Instruction> {
  let doc: Instruction | null = null;

  if (query.provider && query.model) {
    doc = await InstructionModel.getByProviderAndModel(
      query.provider,
      query.model,
    );
  } else {
    doc = await InstructionModel.getByType(query.type);
  }

  if (!doc) {
    const fallback: Partial<Instruction> = {
      provider: query.provider ?? null,
      model: query.model ?? null,
      type: query.type,
      instructions: {
        en: `Default instruction for ${query.model ?? query.type} (EN)`,
        de: `Standardanweisung für ${query.model ?? query.type} (DE)`,
      },
    };

    const created = await InstructionModel.create(fallback);
    doc = { ...fallback, _id: created.insertedId } as Instruction;
  }

  return doc;
}

export const instruction = {
  list: defineAction({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handler: async (input, context) => {
      const results: Instruction[] = [];

      // Add model-based instructions
      for (const { provider, models } of allowedModels) {
        for (const model of models) {
          const doc = await fetchOrCreateInstruction({
            provider,
            model,
            type: "prompt",
          });
          results.push(doc);
        }
      }

      // Add type-based instructions
      for (const type of allowedTypes) {
        const doc = await fetchOrCreateInstruction({ type });
        results.push(doc);
      }

      return transformRawData(results, false);
    },
  }),

  update: defineAction({
    input: InstructionInputParamsSchema,
    handler: async (input) => {
      const updatedDocs: Instruction[] = [];

      for (const item of input) {
        const objectId = new ObjectId(item._id);

        const updated = await InstructionModel.update(objectId, {
          instructions: item.instructions,
        });

        if (updated) {
          updatedDocs.push(updated as Instruction);
        }
      }

      return transformRawData(updatedDocs, false);
    },
  }),
};
