import { ObjectId } from "mongodb";
import { db, type Document } from "../mongodb";
import { z } from "zod";

const UserSchema = z.object({
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

const collection = db.collection("oauth_users");

export default {
  add: async (user: User) => {
    const validated = UserSchema.parse(user);
    return collection.insertOne(validated);
  },

  list: async () => collection.find<Document<User>>({}),

  get: async (email: string) => collection.findOne<Document<User>>({ email }),

  getAuth0Sub: async (auth0_sub: string) =>
    collection.findOne<Document<User>>({ auth0_sub }),
};
