import { defineAction } from "astro:actions";
import type { UserCreate, UserUpdate } from "auth0";
import { ObjectId } from "mongodb";
import { client } from "$data/mongodb";
import { z } from "zod";
import { transformRawData } from "$utils/transformRawData";
import {
  assignPermissions,
  UserRole,
  UserFilterParamsSchema,
  type User,
} from "$data/models/user.model";
import UserModel from "$data/models/user.model";
import usersManagement from "$data/auth0/users-manager";
import organizationsManagement from "$data/auth0/organizations-manager";
import rolesManagement from "$data/auth0/roles-manager";

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

  listByTeant: defineAction({
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

      // Start a new client session for MongoDB operations.
      const session = client.startSession();

      try {
        // Start a transaction to ensure atomicity.
        session.startTransaction();

        // Create new user in Auth0.
        const bodyParameters: UserCreate = {
          email: input.email,
          name: input.name,
          connection: "Username-Password-Authentication",
          password: "@AInow$aibox*6340",
        };
        const userResult = await usersManagement.create(bodyParameters);

        // Add members to an organization
        await organizationsManagement.addMembers(organizationId, [
          userResult.data.user_id,
        ]);

        // Add member roles
        await assignMemberRoles(
          organizationId,
          userResult.data.user_id,
          [],
          input.roles,
        );

        // Create new user in the local database.
        const user: Partial<Omit<User, "_id">> = {
          auth0_sub: userResult.data.user_id,
          username: userResult.data.nickname,
          name: input.name,
          email: input.email,
          roles: input.roles,
          permissions: assignPermissions(input.roles),
          tenant_id: tenantId,
        };
        const insertResult = await UserModel.add(user);

        return transformRawData(insertResult);
      } catch (error) {
        // If an error occurs, abort the transaction and log the error
        await session.abortTransaction();
        throw error;
      } finally {
        // End the session after the transaction
        session.endSession();
      }
    },
  }),

  update: defineAction({
    input: z.intersection(UserInputParamsSchema, UserInputIdentifierSchema),
    handler: async (input, context) => {
      const { org_id: organizationId } = context.locals.tenant;

      // Retrieve the user details from the database.
      const user = await UserModel.get(input._id);
      if (!user) {
        throw new Error("User does not exists.");
      }

      // Start a new client session for MongoDB operations.
      const session = client.startSession();

      try {
        // Start a transaction to ensure atomicity.
        session.startTransaction();

        // Update user in the local database.
        const update: Partial<User> = {
          name: input.name,
          email: input.email,
          roles: input.roles,
        };
        const updatedDocument = await UserModel.update(input._id, update);

        // Update an existing user in Auth0
        const bodyParameters: UserUpdate = {
          name: input.name,
          email: input.email,
        };
        await usersManagement.update(user.auth0_sub, bodyParameters);

        // Add member roles
        await assignMemberRoles(
          organizationId,
          user.auth0_sub,
          user.roles,
          input.roles,
        );

        return transformRawData(updatedDocument);
      } catch (error) {
        // If an error occurs, abort the transaction and log the error
        await session.abortTransaction();
        throw error;
      } finally {
        // End the session after the transaction
        session.endSession();
      }
    },
  }),

  updateBlocked: defineAction({
    input: z.intersection(UserInputIdentifierSchema, UserBlockedSchema),
    handler: async (input) => {
      const { _id: userId, blocked } = input;

      // Retrieve the user details from the database.
      const user = await UserModel.get(userId);
      if (!user) {
        throw new Error("User does not exists.");
      }

      // Start a new client session for MongoDB operations.
      const session = client.startSession();

      try {
        // Start a transaction to ensure atomicity.
        session.startTransaction();

        // Block/Un-Block the user in Auth0.
        if (blocked) {
          await usersManagement.block(user?.auth0_sub);
        } else {
          await usersManagement.unblock(user?.auth0_sub);
        }

        // Update the user's status in the local database.
        let updateResult;
        if (blocked) {
          updateResult = await UserModel.block(input._id);
        } else {
          updateResult = await UserModel.unblock(input._id);
        }

        // If everything goes well, commit the transaction
        await session.commitTransaction();

        return transformRawData(updateResult);
      } catch (error) {
        // If an error occurs, abort the transaction and log the error
        await session.abortTransaction();
        throw error;
      } finally {
        // End the session after the transaction
        session.endSession();
      }
    },
  }),

  delete: defineAction({
    input: UserInputIdentifierSchema,
    handler: async (input) => {
      // Retrieve the user details from the database.
      const user = await UserModel.get(input._id);
      if (!user) {
        throw new Error("User does not exists.");
      }

      // Start a new client session for MongoDB operations.
      const session = client.startSession();

      try {
        // Start a transaction to ensure atomicity.
        session.startTransaction();

        // Un-block the user in Auth0.
        await usersManagement.deleteUser(user?.auth0_sub);

        // Remove the user record from the local database.
        const updateResult = await UserModel.delete(input._id);

        // If everything goes well, commit the transaction
        await session.commitTransaction();

        return transformRawData(updateResult);
      } catch (error) {
        // If an error occurs, abort the transaction and log the error
        await session.abortTransaction();
        throw error;
      } finally {
        // End the session after the transaction
        session.endSession();
      }
    },
  }),
};
