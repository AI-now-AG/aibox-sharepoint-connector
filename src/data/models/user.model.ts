import { ObjectId } from "mongodb";
import { db, type Document } from "../mongodb";
import { z } from "zod";
import log from "$utils/log";

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
  roles: z.array(z.nativeEnum(UserRole)).default(() => [UserRole.User]),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),
  permissions: z
    .array(z.nativeEnum(Permission))
    .default(() => [Permission.UserAll]),
  name: z.string(),
  logins_count: z.number().default(() => 0),
  last_login: z.string(),
  email_verified: z.boolean().default(false),
  blocked: z.boolean().default(false),
  navState: z.record(z.string(), z.boolean()).optional(),
});

export const UserFilterParamsSchema = z.object({
  searchValue: z.string().nullish(),
});

export const UserTenantFilterParamsSchema = z.object({
  tenantId: z.string(),
  searchValue: z.string().nullish(),
  roles: z.array(z.nativeEnum(UserRole)).optional(),
  isBlocked: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  isUnVerified: z.boolean().optional(),
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
      const {
        searchValue,
        tenantId,
        roles,
        isBlocked,
        isVerified,
        isUnVerified,
      } = filterParams;

      log.i(filterParams, "filterParams");

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
      if (roles && roles.length > 0) {
        filter = {
          ...filter,
          ...{
            roles: {
              $in: roles.map((role) => new RegExp(role, "i")),
            },
          },
        };
      }
      if (isBlocked && isVerified && isUnVerified) {
        /* empty */
      } else {
        if (isBlocked === true) {
          if (isVerified == true) {
            filter = {
              ...filter,
              ...{
                $or: [{ blocked: true }, { email_verified: true }],
              },
            };
          } else if (isUnVerified == true) {
            filter = {
              ...filter,
              ...{
                $or: [
                  { blocked: true },
                  { email_verified: false },
                  { email_verified: null },
                ],
              },
            };
          } else {
            filter = {
              ...filter,
              ...{
                blocked: true,
              },
            };
          }
        } else {
          if (isVerified === true && isUnVerified == true) {
            /* empty */
          } else if (isVerified === true) {
            filter = {
              ...filter,
              ...{ email_verified: true },
            };
          } else if (isUnVerified === true) {
            filter = {
              ...filter,
              ...{
                $or: [{ email_verified: false }, { email_verified: null }],
              },
            };
          }
        }
      }
    }

    const data = collection.find<Document<User>>(filter);
    return await data.toArray();
  },

  get: async (email: string) => collection.findOne<User>({ email }),

  getById: async (id: string) =>
    collection.findOne<User>({ _id: new ObjectId(id) }),

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

  block: async (id: string) => {
    return await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { blocked: true } },
    );
  },

  unblock: async (id: string) => {
    return await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { blocked: false } },
    );
  },

  delete: async (id: string) => {
    return await collection.deleteOne({ _id: new ObjectId(id) });
  },
};
