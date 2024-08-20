import { ObjectId } from 'mongodb';
import { d as db } from './mongodb_BtEbS6qU.mjs';
import { z } from 'zod';

const InstructionSchema = z.object({
  tenant_id: z.instanceof(ObjectId).optional(),
  creator_id: z.instanceof(ObjectId).optional(),
  title: z.string(),
  description: z.string(),
  instruction: z.string(),
  created_at: z.date().optional(),
  updated_at: z.date()
});
const collection = db.collection("instructions");
const InstructionModel = {
  add: async (prompt) => {
    const validated = InstructionSchema.parse(prompt);
    return collection.insertOne(validated);
  },
  remove: async (id) => {
    const _id = new ObjectId(id);
    return collection.deleteOne({ _id });
  },
  get: async (id) => {
    const _id = new ObjectId(id);
    return collection.findOne({ _id });
  },
  list: async () => collection.find({}).sort({ created_at: 1 }),
  listByUser: async (id) => {
    const _id = new ObjectId(id);
    return collection.find({ creator_id: _id }).sort({ created_at: 1 });
  },
  update: async (id, updatedInstruction) => {
    const _id = new ObjectId(id);
    const validated = InstructionSchema.partial().parse(updatedInstruction);
    const result = await collection.updateOne(
      { _id },
      { $set: { ...validated } }
    );
    return result;
  }
};

export { InstructionModel as I };
