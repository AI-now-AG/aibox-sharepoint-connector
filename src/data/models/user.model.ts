import { ObjectId } from "mongodb";
import { db } from "../mongodb";
import { z } from "zod";

const UserSchema = z.object({
  _id: z.instanceof(ObjectId),
  tenant_id: z.instanceof(ObjectId),
  auth0_sub: z.string().min(24),
  username: z.string().min(2),
  email: z.string(),
  picture: z.string().url().optional(),
  roles: z.array(z.string()),
  created_at: z.date(),
  updated_at: z.date(),
});

export type User = z.infer<typeof UserSchema>;

export const collection = db.collection<User>("oauth_users");

export default {
  add: async (user: Omit<User, "_id">) => {
    const validated = UserSchema.parse({ _id: new ObjectId(), ...user });
    return collection.insertOne(validated);
  },

  list: async () => collection.find<User>({}),

  get: async (email: string) => collection.findOne<User>({ email }),

  getAuth0Sub: async (auth0_sub: string) =>
    collection.findOne<User>({ auth0_sub }),
};
