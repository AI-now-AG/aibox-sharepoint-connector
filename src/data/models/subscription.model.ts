import { ObjectId } from "mongodb";
import { db, toObjectId } from "../mongodb";
import {
  SubscriptionStatus,
  SubscriptionPackageId,
  SubscriptionExtraPackage,
  AudioOptionId,
} from "$types/Subscription";
import { z } from "zod";

const SubscriptionSchema = z.object({
  _id: z.instanceof(ObjectId),
  tenant_id: z.instanceof(ObjectId).optional(),
  plan_name: z
    .nativeEnum({ ...SubscriptionPackageId, ...SubscriptionExtraPackage })
    .or(z.literal(""))
    .optional(),
  status: z.nativeEnum(SubscriptionStatus).optional(),
  metadata: z.record(z.any()).nullish(),
  add_ons: z.array(z.nativeEnum(AudioOptionId)).optional(),
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
    const doc = {
      status: SubscriptionStatus.Active,
      ...validated,
    };

    return await collection.insertOne(doc);
  },

  update: async (
    tenantId: string | ObjectId,
    update: Partial<Subscription>,
  ) => {
    const _tenantId = toObjectId(tenantId);
    const validated = SubscriptionSchema.partial().parse(update);
    const doc = {
      ...validated,
      updated_at: new Date(),
    };
    return await collection.findOneAndUpdate(
      { tenant_id: _tenantId },
      { $set: doc },
      {
        returnDocument: "after",
      },
    );
  },

  getOrCreateSubscription: async (tenantId: string | ObjectId) => {
    const _tenantId = toObjectId(tenantId);
    return await collection.findOneAndUpdate(
      { tenant_id: _tenantId },
      {
        $setOnInsert: {
          tenant_id: _tenantId,
          plan_name: null,
          add_ons: [],
          status: SubscriptionStatus.Active,
          created_at: new Date(),
          updated_at: new Date(),
        },
      },
      {
        upsert: true,
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
