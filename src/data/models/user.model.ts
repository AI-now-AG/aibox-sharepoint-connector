import { ObjectId } from "mongodb";
import { db, toObjectId, type Document } from "../mongodb";
import { z } from "zod";
import log from "$utils/log";
import {
  Permission,
  ROLE_PERMISSIONS_MAP,
  UserRole,
  TourType,
} from "$types/Users";

export const UserTour = z.object({
  type: z.nativeEnum(TourType).default(TourType.Onboarding),
  active: z.boolean().default(true),
});

const UserSchema = z.object({
  _id: z.instanceof(ObjectId),
  tenant_id: z.instanceof(ObjectId),
  auth0_sub: z.string().min(24),
  username: z.string().min(2),
  email: z.string(),
  picture: z.string().url().optional(),
  roles: z.array(z.nativeEnum(UserRole)).default(() => [UserRole.User]),
  created_at: z
    .date()
    .optional()
    .default(() => new Date()),
  updated_at: z
    .date()
    .optional()
    .default(() => new Date()),
  permissions: z
    .array(z.nativeEnum(Permission))
    .default(() => [Permission.UserAll]),
  name: z.string(),
  logins_count: z.number().default(0),
  last_login: z.string().nullish().default(null),
  email_verified: z.boolean().default(false),
  blocked: z.boolean().default(false),
  navState: z.record(z.string(), z.boolean()).optional(),
  tours: z.array(UserTour).optional(),
  api_token: z.string().nullish().default(null),
  created_by_admin: z.boolean().nullish().default(false),
  is_complete_self_registration: z.boolean().nullish().default(false),
});

export const UserFilterParamsSchema = z.object({
  searchValue: z.string().nullish(),
  roles: z.array(z.nativeEnum(UserRole)).optional(),
  isBlocked: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  isUnVerified: z.boolean().optional(),
  isExcludeSA: z.boolean().optional().default(true),
});
export type UserFilterParams = z.infer<typeof UserFilterParamsSchema>;
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
  const objectId = toObjectId(userId);
  const updateField = { [`navState.${detailsId}`]: isOpen };

  return await collection.findOneAndUpdate(
    { _id: objectId },
    { $set: updateField },
    { returnDocument: "after" },
  );
}

export default {
  add: async (user: Partial<Omit<User, "_id">>) => {
    const validated = UserSchema.parse({ _id: new ObjectId(), ...user });
    return collection.insertOne(validated);
  },

  update: async (id: string | ObjectId, user: Partial<User>) => {
    const objectId = toObjectId(id);
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

  listByTenant: async (tenantId: ObjectId, filterParams?: UserFilterParams) => {
    const filter: Record<string, unknown> = {
      tenant_id: tenantId,
    };

    if (filterParams) {
      const { searchValue, roles, isBlocked, isVerified, isUnVerified } =
        filterParams;

      log.i(filterParams, "filterParams");

      // Add search filter
      if (searchValue) {
        filter.name = { $regex: searchValue, $options: "i" };
      }

      // Add roles filter
      const filterRoles: Record<string, unknown> = {};

      // If specific roles are provided, add them to $in
      if (roles && roles.length > 0) {
        filterRoles.$in = roles.map((role) => new RegExp(role, "i"));
      }

      // If "isExcludeSA" flag is true, exclude Super Admin
      if (filterParams.isExcludeSA) {
        filterRoles.$nin = [new RegExp(`^${UserRole.SuperAdmin}$`, "i")];
      }

      // Only assign filter.roles if there's something to filter by
      if (Object.keys(filterRoles).length > 0) {
        filter.roles = filterRoles;
      }

      // Handle isBlocked, isVerified, and isUnVerified filters
      const emailVerifiedFilter = [];
      if (isVerified) {
        emailVerifiedFilter.push({ email_verified: true });
      }
      if (isUnVerified) {
        emailVerifiedFilter.push({ email_verified: { $in: [false, null] } });
      }
      if (isBlocked || isVerified || isUnVerified) {
        if (isBlocked) {
          filter.blocked = true;
          if (emailVerifiedFilter.length > 0) {
            delete filter.blocked;
            filter.$or = [{ blocked: true }, ...emailVerifiedFilter];
          }
        } else if (emailVerifiedFilter.length > 0) {
          filter.$or = emailVerifiedFilter;
        }
      }
    }

    const data = collection.find<Document<User>>(filter);
    return await data.toArray();
  },

  get: async (id: string): Promise<User | null> => {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    return collection.findOne<User>({ _id: new ObjectId(id) });
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

  addTour: async (id: string | ObjectId, tour: z.infer<typeof UserTour>) => {
    const _objectId = toObjectId(id);
    return await collection.updateOne(
      { _id: _objectId },
      {
        $addToSet: {
          tours: tour,
        },
      },
    );
  },

  updateTour: async (
    id: string | ObjectId,
    tours: z.infer<typeof UserTour>[],
  ) => {
    const _objectId = toObjectId(id);
    return await collection.updateOne(
      { _id: _objectId },
      { $set: { tours: tours } },
    );
  },

  countUsersByTenant: async (tenantId: string | ObjectId) => {
    const _tenantId = toObjectId(tenantId);
    return await collection.countDocuments({
      tenant_id: _tenantId,
      roles: { $nin: [UserRole.SuperAdmin] },
    });
  },

  countActiveUsersByTenant: async (tenantId: string | ObjectId) => {
    const _tenantId = toObjectId(tenantId);
    return await collection.countDocuments({
      tenant_id: _tenantId,
      blocked: false,
      roles: { $nin: [UserRole.SuperAdmin] },
    });
  },

  delete: async (id: string) => {
    return await collection.deleteOne({ _id: new ObjectId(id) });
  },

  listForExport: async ({
    page = 1,
    pageSize = 20,
    search = "",
  }: {
    page?: number;
    pageSize?: number;
    search?: string;
  }) => {
    const skip = (page - 1) * pageSize;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baseMatch: any = {};

    // escape regex
    const escapeRegex = (text: string): string => {
      return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    };

    if (search.trim()) {
      const safeSearch = escapeRegex(search.trim());
      baseMatch.$or = [
        { username: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
      ];
    }

    // Build pipeline dynamically
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipeline: any[] = [
      {
        // 🔍 search happens HERE (before lookups)
        $match: baseMatch,
      },
      {
        $lookup: {
          from: "tenants",
          localField: "tenant_id",
          foreignField: "_id",
          as: "tenant",
        },
      },
      {
        $unwind: "$tenant",
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          last_login: 1,
          logins_count: 1,
          blocked: 1,
          email_verified: 1,
          auth0_sub: 1,
          roles: 1,
          created_at: 1,
          updated_at: 1,
          tenant: {
            _id: 1,
            name: 1,
          },
        },
      },
      { $sort: { created_at: 1 } },
    ];

    // ✅ Only paginate if pageSize > 0
    if (pageSize > 0) {
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: pageSize });
    }

    const totalResult = await collection
      .aggregate([
        { $match: baseMatch },
        {
          $lookup: {
            from: "tenants",
            localField: "tenant_id",
            foreignField: "_id",
            as: "tenant",
          },
        },
        { $unwind: "$tenant" },
        { $count: "count" },
      ])
      .toArray();

    const result = await collection.aggregate(pipeline).toArray();
    const total = totalResult[0]?.count ?? 0;

    return {
      data: result,
      total: total,
      page,
      pageSize,
      search,
    };
  },
};
