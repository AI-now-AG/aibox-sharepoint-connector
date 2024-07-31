import { ObjectId } from "mongodb";
import { db } from "../mongodb";
import { z } from "zod";

const TenantSchema = z.object({
  _id: z.instanceof(ObjectId),
  name: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
});

export type Tenant = z.infer<typeof TenantSchema>;

const collection = db.collection("tenants");

export default {
  add: async (prompt: Tenant) => {
    const validated = TenantSchema.parse(prompt);
    return collection.insertOne(validated);
  },

  all: async () => collection.find<Tenant>({}),

  get: async (id: string) => {
    const _id = new ObjectId(id);
    return collection.findOne<Tenant>({ _id });
  },
};
