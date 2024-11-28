import { ObjectId } from "mongodb";
import { db } from "../mongodb";
import { z } from "zod";

export enum UserRole {
  Admin = "Admin",
  SuperAdmin = "Super Admin",
  User = "User",
}

export enum Permission {
  UserAll = "user:all",
  AdminAll = "admin:all",
  SuperAll = "super:all",
}

const UserSchema = z.object({
  _id: z.instanceof(ObjectId),
  tenant_id: z.instanceof(ObjectId),
  auth0_sub: z.string().min(24),
  name: z.string().min(2),
  username: z.string().min(2),
  email: z.string(),
  picture: z.string().url().optional(),
  roles: z.array(z.nativeEnum(UserRole)),
  created_at: z.date(),
  updated_at: z.date(),
  permissions: z.array(z.nativeEnum(Permission)),
  navState: z.record(z.string(), z.boolean()).optional(),
});

export type User = z.infer<typeof UserSchema>;

export const collection = db.collection<User>("oauth_users");

export const rolePermissionsMap = {
  [UserRole.User]: [Permission.UserAll],
  [UserRole.Admin]: [Permission.UserAll, Permission.AdminAll],
  [UserRole.SuperAdmin]: [
    Permission.UserAll,
    Permission.AdminAll,
    Permission.SuperAll,
  ],
};

export function assignPermissions(roles: UserRole[]): Permission[] {
  const permissionsSet = new Set<Permission>();
  roles.forEach((role) => {
    const rolePermissions = rolePermissionsMap[role];
    rolePermissions.forEach((permission) => permissionsSet.add(permission));
  });
  return Array.from(permissionsSet);
}

export async function updateUserData(
  userId: string | ObjectId,
  detailsId: string,
  isOpen: boolean
) {
  const objectId = userId instanceof ObjectId ? userId : new ObjectId(userId);
  const updateField = { [`navState.${detailsId}`]: isOpen };

  return await collection.findOneAndUpdate(
    { _id: objectId },
    { $set: updateField },
    { returnDocument: "after" }
  );
}

export default {
  add: async (user: Omit<User, "_id">) => {
    const validated = UserSchema.parse({ _id: new ObjectId(), ...user });
    return collection.insertOne(validated);
  },

  update: async (id: string | ObjectId, user: Partial<User>) => {
    const objectId = id instanceof ObjectId ? id : new ObjectId(id);
    const validated = UserSchema.partial().parse(user);
    const doc = {
      ...validated,
      ...{
        updated_at: new Date(),
      },
    };
    return await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: doc },
      {
        returnDocument: "after",
      },
    );
  },

  list: async () => collection.find<User>({}),

  get: async (email: string) => collection.findOne<User>({ email }),

  getAuth0Sub: async (auth0_sub: string) =>
    collection.findOne<User>({ auth0_sub }),

  getByEmail: async (email: string) => collection.findOne<User>({ email }),

  updateRole: async (auth0_sub: string, newRoles: UserRole[]) => {
    const validRoles = z.array(z.nativeEnum(UserRole)).parse(newRoles);
    const newPermissions = assignPermissions(validRoles);
    const result = await collection.updateOne(
      { auth0_sub },
      {
        $set: {
          roles: validRoles,
          permissions: newPermissions,
          updated_at: new Date(),
        },
      },
    );
    return result;
  },
};
