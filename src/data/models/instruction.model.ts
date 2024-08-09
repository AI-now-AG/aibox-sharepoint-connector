import { ObjectId } from "mongodb";
import { db, type Document } from "../mongodb";
import { z } from "zod";

const InstructionSchema = z.object({
  tenant_id: z.instanceof(ObjectId),
  creator_id: z.instanceof(ObjectId),
  title: z.string(),
  description: z.string(),
  instruction: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
});

export type Instruction = z.infer<typeof InstructionSchema>;

const collection = db.collection("instructions");

export default {
  add: async (prompt: Instruction) => {
    const validated = InstructionSchema.parse(prompt);
    return collection.insertOne(validated);
  },

  remove: async (id: string) => {
    const _id = new ObjectId(id);
    return collection.deleteOne({ _id });
  },

  get: async (id: string) => {
    const _id = new ObjectId(id);
    return collection.findOne<Document<Instruction>>({ _id });
  },

  list: async () => collection.find<Document<Instruction>>({}).sort({created_at: 1}),

  listByUser: async (id: string) => {
    const _id = new ObjectId(id);
    return collection.find<Document<Instruction>>({ creator_id: _id }).sort({created_at: 1})
  },
};
