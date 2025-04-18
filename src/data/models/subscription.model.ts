import { ObjectId } from "mongodb";
import { db, toObjectId } from "../mongodb";
import { SubscriptionStatus, PlanName, AddOnsName } from "$types/Subscription";
import { z } from "zod";

const SubscriptionSchema = z.object({
  _id: z.instanceof(ObjectId),
  tenant_id: z.instanceof(ObjectId).optional(),
  plan_name: z.nativeEnum(PlanName).optional(),
  status: z.nativeEnum(SubscriptionStatus).optional(),
  start_date: z
    .date()
    .optional()
    .default(() => new Date()),
  end_date: z
    .date()
    .optional()
    .default(() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      return d;
    }),
  metadata: z.record(z.any()).nullish(),
  add_ons: z
    .array(
      z.object({
        name: z.nativeEnum(AddOnsName),
        title: z.string().optional(),
      }),
    )
    .optional(),
  notes: z.string().optional(),
  created_at: z
    .date()
    .optional()
    .default(() => new Date()),
  updated_at: z
    .date()
    .optional()
    .default(() => new Date()),
});
export type Subscription = z.infer<typeof SubscriptionSchema>;

const collection = db.collection("subscriptions");

export default {
  create: async (subscription: Partial<Omit<Subscription, "_id">>) => {
    const validated = SubscriptionSchema.parse({
      _id: new ObjectId(),
      ...subscription,
    });
    return await collection.insertOne(validated);
  },

  update: async (id: string | ObjectId, update: Partial<Subscription>) => {
    const objectId = toObjectId(id);
    const validated = SubscriptionSchema.partial().parse(update);
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

  findByTenant: async (tenantId: string | ObjectId) => {
    const id = toObjectId(tenantId);
    return await collection.findOne({ tenant_id: id });
  },

  findActiveByTenant: async (tenantId: string | ObjectId) => {
    const id = toObjectId(tenantId);
    return await collection.findOne({
      tenant_id: id,
      status: SubscriptionStatus.Active,
    });
  },
};
