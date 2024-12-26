import { ObjectId } from "mongodb";
import { db, type Document } from "../mongodb";
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

export const ROLE_PERMISSIONS_MAP = {
  [UserRole.User]: [Permission.UserAll],
  [UserRole.Admin]: [Permission.UserAll, Permission.AdminAll],
  [UserRole.SuperAdmin]: [
    Permission.UserAll,
    Permission.AdminAll,
    Permission.SuperAll,
  ],
};

const UserSchema = z.object({
  _id: z.instanceof(ObjectId),
  tenant_id: z.instanceof(ObjectId),
  auth0_sub: z.string().min(24),
  username: z.string().min(2),
  email: z.string(),
  picture: z.string().url().optional(),
  roles: z.array(z.nativeEnum(UserRole)),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),
  permissions: z.array(z.nativeEnum(Permission)),
  name: z.string(),
  navState: z.record(z.string(), z.boolean()).optional(),
});

export const UserFilterParamsSchema = z.object({
  searchValue: z.string().nullish(),
});

export const UserTenantFilterParamsSchema = z.object({
  tenantId: z.string(),
  searchValue: z.string().nullish(),
});
export type UserFilterParams = z.infer<typeof UserFilterParamsSchema>;
export type UserTenantFilterParams = z.infer<
  typeof UserTenantFilterParamsSchema
>;
export type User = z.infer<typeof UserSchema>;

export const collection = db.collection<User>("oauth_users");

export function assignPermissions(roles: UserRole[]): Permission[] {
  const permissionsSet = new Set<Permission>();
  roles.forEach((role) => {
    const rolePermissions = ROLE_PERMISSIONS_MAP[role];
    rolePermissions.forEach((permission) => permissionsSet.add(permission));
  });
  return Array.from(permissionsSet);
}

export async function updateUserData(
  userId: string | ObjectId,
  detailsId: string,
  isOpen: boolean,
) {
  const objectId = userId instanceof ObjectId ? userId : new ObjectId(userId);
  const updateField = { [`navState.${detailsId}`]: isOpen };

  return await collection.findOneAndUpdate(
    { _id: objectId },
    { $set: updateField },
    { returnDocument: "after" },
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

  list: async (filterParams?: UserFilterParams) => {
    let filter = {};

    if (filterParams) {
      const { searchValue } = filterParams;

      if (searchValue) {
        filter = {
          ...filter,
          ...{
            name: {
              $regex: searchValue,
              $options: "i",
            },
          },
        };
      }
    }

    const data = collection.find<Document<User>>(filter);
    return await data.toArray();
  },

  listByTenant: async (filterParams?: UserTenantFilterParams) => {
    let filter = {};
    if (filterParams) {
      const { searchValue, tenantId } = filterParams;

      if (tenantId) {
        filter = {
          ...filter,
          ...{ tenant_id: new ObjectId(tenantId) },
        };
      }
      if (searchValue) {
        filter = {
          ...filter,
          ...{
            name: {
              $regex: searchValue,
              $options: "i",
            },
          },
        };
      }
    }

    const data = collection.find<Document<User>>(filter);
    return await data.toArray();
  },

  get: async (email: string) => collection.findOne<User>({ email }),

  getById: async (_id: string) => {
    const validated = UserSchema.parse({ _id: new ObjectId(_id) });
    collection.findOne<User>({ ...validated });
  },

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

  upsertByAuth0Sub: async (auth0Sub: string, user: Partial<User>) => {
    const existingUser = await collection.findOne<User>({
      auth0_sub: auth0Sub,
    });
    if (existingUser) {
      const validatedUser = UserSchema.partial().parse(user);
      await collection.findOneAndUpdate(
        { _id: existingUser._id },
        {
          $set: {
            ...validatedUser,
            updated_at: new Date(),
          },
        },
      );
      return existingUser._id;
    }

    const validatedUser = UserSchema.parse({
      _id: new ObjectId(),
      ...user,
    });
    const createdUser = await collection.insertOne(validatedUser);
    return createdUser.insertedId;
  },
};
