import { ObjectId } from "mongodb";
import { db, type Document } from "../mongodb";
import { z } from "zod";

const TenantSchema = z.object({
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

  list: async () => collection.find<Document<Tenant>>({}),

  get: async (id: string) => {
    const _id = new ObjectId(id);
    return collection.findOne<Document<Tenant>>({ _id });
  },
};
