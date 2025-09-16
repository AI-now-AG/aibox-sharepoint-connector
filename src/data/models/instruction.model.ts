import { ObjectId } from "mongodb";
import { db, toObjectId, type Document } from "../mongodb";
import { ApiKeyProvider } from "$types/TenantFeature";
import { z } from "zod";

export const InstructionsSchema = z.object({
  en: z.string().min(1, "English instruction required").optional(),
  de: z.string().min(1, "German instruction required").optional(),
});
export type Instructions = z.infer<typeof InstructionsSchema>;

export const InstructionTypeEnum = z.enum(["prompt", "home", "knowledge_base"]);
export type InstructionType = z.infer<typeof InstructionTypeEnum>;

// Zod schema for a instruction
export const InstructionSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  provider: z.nativeEnum(ApiKeyProvider).optional(),
  model: z.string().nullish().default(null),
  type: InstructionTypeEnum.default("prompt"),
  instructions: InstructionsSchema,
  created_at: z
    .date()
    .optional()
    .default(() => new Date()),
  updated_at: z
    .date()
    .optional()
    .default(() => new Date()),
});
export type Instruction = z.infer<typeof InstructionSchema>;

const collection = db.collection("instructions");

export default {
  create: async (instruction: Partial<Omit<Instruction, "_id">>) => {
    const validated = InstructionSchema.parse(instruction);
    const doc = {
      ...validated,
    };
    return collection.insertOne(doc);
  },

  update: async (id: string | ObjectId, update: Partial<Instruction>) => {
    const objectId = toObjectId(id);
    const validated = InstructionSchema.partial().parse(update);

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

  getByType: async (type: InstructionType) => {
    return collection.findOne<Document<Instruction>>({ type });
  },

  getByProviderAndModel: async (provider: ApiKeyProvider, model: string) => {
    return collection.findOne<Document<Instruction>>({ provider, model });
  },
};
