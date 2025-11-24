import { defineAction } from "astro:actions";
import { ObjectId } from "mongodb";
import { client } from "$data/mongodb";
import { z } from "zod";
import { transformRawData } from "$utils/transformRawData";
import {
  assignPermissions,
  UserFilterParamsSchema,
  type User,
} from "$data/models/user.model";
import UserModel from "$data/models/user.model";
import usersManagement from "$data/auth0/users-manager";
import organizationsManagement from "$data/auth0/organizations-manager";
import rolesManagement from "$data/auth0/roles-manager";
import { isEnterpriseConnection } from "$utils/auth0";
import { EncryptedUserPassword, TourType, UserRole } from "$types/Users";

const UserInputParamsSchema = z.object({
  name: z.string(),
  email: z.string(),
  roles: z.array(z.nativeEnum(UserRole)),
});

const UserInputIdentifierSchema = z.object({
  _id: z.string(),
});

const TenantInputIdentifierSchema = z.object({
  tenantId: z.string(),
});

const UserBlockedSchema = z.object({
  blocked: z.boolean(),
});

const assignMemberRoles = async (
  organizationId: string,
  userId: string,
  oldRoles: string[],
  newRoles: string[],
) => {
  // Get all roles from Auth0
  const allRoles = await rolesManagement.getAll();

  // Detach old member roles
  if (oldRoles.length > 0) {
    const rolesToDetach = allRoles.data
      .filter((role) => {
        return oldRoles.includes(role.name);
      })
      .map((role) => role.id);
    await organizationsManagement.deleteMemberRoles(
      organizationId,
      userId,
      rolesToDetach,
    );
  }

  // Attach new member roles
  if (newRoles.length > 0) {
    const rolesToAttach = allRoles.data
      .filter((role) => {
        return newRoles.includes(role.name);
      })
      .map((role) => role.id);
    await organizationsManagement.addMemberRoles(
      organizationId,
      userId,
      rolesToAttach,
    );
  }
};

export const user = {
  get: defineAction({
    input: UserInputIdentifierSchema,
    handler: async (input) => {
      const data = await UserModel.get(input._id);
      return transformRawData(data);
    },
  }),

  listByTenant: defineAction({
    input: z.intersection(UserFilterParamsSchema, TenantInputIdentifierSchema),
    handler: async (input) => {
      const tenantId = new ObjectId(input.tenantId);
      const data = await UserModel.listByTenant(tenantId, input);
      return transformRawData(data);
    },
  }),

  create: defineAction({
    input: UserInputParamsSchema,
    handler: async (input, context) => {
      const { _id: tenantId, org_id: organizationId } = context.locals.tenant;

      const session = client.startSession();
      session.startTransaction();

      try {
        const userResult = await usersManagement.create({
          email: input.email,
          name: input.name,
          connection: "Username-Password-Authentication",
          password: EncryptedUserPassword,
        });

        const userId = userResult.data.user_id;

        // Add user to Auth0 organization and assign roles
        await Promise.all([
          organizationsManagement.addMembers(organizationId, [userId]),
          assignMemberRoles(organizationId, userId, [], input.roles),
        ]);

        const newUser = {
          auth0_sub: userId,
          username: userResult.data.nickname,
          name: input.name,
          email: input.email,
          roles: input.roles,
          permissions: assignPermissions(input.roles),
          tenant_id: tenantId,
          created_by_admin: true,
        };
        const result = await UserModel.add(newUser);

        await session.commitTransaction();
        return transformRawData(result);
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    },
  }),

  update: defineAction({
    input: z.intersection(UserInputParamsSchema, UserInputIdentifierSchema),
    handler: async (input, context) => {
      const { org_id: organizationId } = context.locals.tenant;
      const user = await UserModel.get(input._id);
      if (!user) {
        throw new Error("User does not exists.");
      }

      const session = client.startSession();
      session.startTransaction();
      try {
        const updatedData: Partial<User> = {
          name: input.name,
          email: input.email,
          roles: input.roles,
          permissions: assignPermissions(input.roles),
        };
        const updatedUser = await UserModel.update(input._id, updatedData);

        // Update user in Auth0 if not an enterprise connection
        if (!isEnterpriseConnection(user.auth0_sub)) {
          await usersManagement.update(user.auth0_sub, {
            name: input.name,
            email: input.email,
          });
        }

        await assignMemberRoles(
          organizationId,
          user.auth0_sub,
          user.roles,
          input.roles,
        );

        await session.commitTransaction();
        return transformRawData(updatedUser);
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    },
  }),

  updateBlocked: defineAction({
    input: z.intersection(UserInputIdentifierSchema, UserBlockedSchema),
    handler: async (input) => {
      const { _id: userId, blocked } = input;
      const user = await UserModel.get(userId);
      if (!user) {
        throw new Error("User does not exists.");
      }

      const session = client.startSession();
      session.startTransaction();

      try {
        const auth0Action = blocked
          ? usersManagement.block(user.auth0_sub)
          : usersManagement.unblock(user.auth0_sub);
        await auth0Action;

        // Update block status in the local database
        const updateResult = blocked
          ? await UserModel.block(userId)
          : await UserModel.unblock(userId);

        await session.commitTransaction();
        return transformRawData(updateResult);
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    },
  }),

  deactiveTour: defineAction({
    input: z.intersection(
      UserInputIdentifierSchema,
      z.object({ type: z.nativeEnum(TourType).default(TourType.Onboarding) }),
    ),
    handler: async (input) => {
      const { _id: userId, type } = input;
      const user = await UserModel.get(userId);
      if (!user) {
        throw new Error("User does not exists.");
      }

      if (!Object.values(TourType).includes(type)) {
        throw new Error("Invalid tour type.");
      }

      let userTours = user.tours ?? [
        { type: TourType.Onboarding, active: false },
      ];

      if (!userTours.some((tour) => tour.type == type)) {
        userTours.push({ type, active: false });
      } else {
        userTours = userTours.map((tour) => {
          if (tour.type == type) {
            return { ...tour, active: false };
          }
          return tour;
        });
      }
      await UserModel.updateTour(userId, userTours);

      return { success: true };
    },
  }),

  activeOboarding: defineAction({
    input: z.intersection(
      UserInputIdentifierSchema,
      z.object({ type: z.nativeEnum(TourType).default(TourType.Onboarding) }),
    ),
    handler: async (input) => {
      const { _id: userId, type } = input;
      const user = await UserModel.get(userId);
      if (!user) {
        throw new Error("User does not exists.");
      }

      const defaultTours = [
        { type: TourType.Onboarding, active: true },
        { type: TourType.OnboardingNewTenant, active: true },
      ];

      const userTours = (user.tours ?? defaultTours).map((tour) => ({
        ...tour,
        active: tour.type === type ? true : tour.active,
      }));

      await UserModel.updateTour(userId, userTours);

      return { success: true };
    },
  }),

  resetLoginCount: defineAction({
    input: UserInputIdentifierSchema,
    handler: async (input) => {
      const { _id: userId } = input;
      const user = await UserModel.get(userId);
      if (!user) {
        throw new Error("User does not exists.");
      }

      await UserModel.update(userId, { logins_count: 0 });
      console.log("User logins count reset successfully.");
    },
  }),

  delete: defineAction({
    input: UserInputIdentifierSchema,
    handler: async (input) => {
      const user = await UserModel.get(input._id);
      if (!user) {
        throw new Error("User does not exists.");
      }

      const session = client.startSession();
      session.startTransaction();
      try {
        await usersManagement.deleteUser(user?.auth0_sub);
        const updateResult = await UserModel.delete(input._id);

        await session.commitTransaction();
        return transformRawData(updateResult);
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    },
  }),
};
