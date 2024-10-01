import { ObjectId } from "mongodb";
import { db, type Document } from "../mongodb";
import { z } from "zod";

const TenantSchema = z.object({
  name: z.string().min(1),
  org_name: z.string().min(1),
  auth0_id: z.string().nullish(),
  theme: z.string().nullish(),
  primary_color: z.string().nullish(),
  openai_api_key: z.string().nullish(),
  active: z.boolean().default(true).optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type Tenant = z.infer<typeof TenantSchema>;

const collection = db.collection("tenants");

export default {
  create: async (tenant: Tenant) => {
    const validated = TenantSchema.parse(tenant);
    const doc = {
      ...validated,
      ...{
        created_at: new Date(),
        updated_at: new Date(),
      },
    };
    console.log("doc", doc);
    return await collection.insertOne(doc);
  },

  update: async (id: string, tenant: Tenant) => {
    const validated = TenantSchema.partial().parse(tenant);
    const doc = {
      ...validated,
      ...{
        updated_at: new Date(),
      },
    };
    return await collection.updateOne({ _id: new ObjectId(id) }, doc);
  },

  archive: async (id: string) => {
    return await collection.updateOne(
      { _id: new ObjectId(id) },
      { active: false },
    );
  },

  list: async () => {
    const data = collection.find<Document<Tenant>>({});
    return await data.toArray();
  },

  get: async (id: string) => {
    return await collection.findOne<Document<Tenant>>({
      _id: new ObjectId(id),
    });
  },

  getByName: async (org_name: string) => {
    return await collection.findOne<Document<Tenant>>({ org_name });
  },

  getByAuth0Id: async (auth0_id: string) => {
    return await collection.findOne<Document<Tenant>>({ auth0_id });
  },
};
