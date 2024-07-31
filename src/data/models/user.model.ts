import { ObjectId } from "mongodb";
import { db } from "../mongodb";
import { z } from "zod";

const UserSchema = z.object({
  _id: z.instanceof(ObjectId),
  tenant_id: z.instanceof(ObjectId),
  username: z.string().min(2),
  password: z.string().min(8),
  roles: z.array(z.string()),
  created_at: z.date(),
  updated_at: z.date(),
});

export type User = z.infer<typeof UserSchema>;

const collection = db.collection("users");

export default {
  add: async (user: User) => {
    const validated = UserSchema.parse(user);
    return collection.insertOne(validated);
  },

  all: async () => collection.find<User>({}),

  get: async (email: string) => collection.findOne<User>({ email }),
};
