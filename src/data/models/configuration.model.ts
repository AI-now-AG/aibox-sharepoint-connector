import { db, toObjectId } from "$data/mongodb";
import { ObjectId } from "mongodb";
import { z } from "zod";

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

export const ProviderInstructionSchema = z.object({
  provider: z.string(),
  instruction: InstructionSchema,
  models: ModelInstructionSchema.nullish().default({}),
});

export const ConfigurationSchema = z.object({
  _id: z.instanceof(ObjectId),
  defaultInstructions: z.array(ProviderInstructionSchema),
  promptRefinementInstruction: z.string().nullish().default(null),
  promptKbGenerationInstruction: z.string().nullish().default(null),
  citationInstruction: InstructionSchema.optional(),
  created_at: z
    .date()
    .optional()
    .default(() => new Date()),
  updated_at: z
    .date()
    .optional()
    .default(() => new Date()),
});

export type Configuration = z.infer<typeof ConfigurationSchema>;

export const collection = db.collection<Configuration>("configurations");

export default {
  update: async (id: string | ObjectId, update: Partial<Configuration>) => {
    const objectId = toObjectId(id);
    const validated = ConfigurationSchema.partial().parse(update);
    const doc = {
      ...validated,
      updated_at: new Date(),
    };
    return await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: doc },
      {
        returnDocument: "after",
      },
    );
  },

  get: async (): Promise<Configuration> => {
    const data = collection.find();
    return (await data.toArray())?.[0];
  },
};
