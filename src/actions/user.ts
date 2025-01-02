import { defineAction } from "astro:actions";
import type { PatchUsersByIdRequest, UserCreate, UserUpdate } from "auth0";
import { ObjectId } from "mongodb";
import { client } from "$data/mongodb";
import { z } from "zod";
import { transformRawData } from "$utils/transformRawData";
import {
  assignPermissions,
  Permission,
  UserRole,
  UserFilterParamsSchema,
  type User,
} from "$data/models/user.model";
import UserModel from "$data/models/user.model";
import usersManagement from "$data/auth0/users-manager";

const UserInputParamsSchema = z.object({
  tenant_id: z.string(),
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
    handler: async (input) => {
      // Create new user in Auth0.
      const bodyParameters: UserCreate = {
        email: input.email,
        name: input.name,
        connection: "Username-Password-Authentication",
        password: "@AInow$aibox*6340",
      };
      const userResult = await usersManagement.create(bodyParameters);

      // Assign org

      // Org Roles?

      // Create new user in the local database.
      const user: Partial<Omit<User, "_id">> = {
        auth0_sub: userResult.data.user_id,
        username: userResult.data.nickname,
        name: input.name,
        email: input.email,
        roles: input.roles,
        permissions: assignPermissions(input.roles),
        tenant_id: new ObjectId(input.tenant_id),
      };
      const insertResult = await UserModel.add(user);

      return transformRawData(insertResult);
    },
  }),

  update: defineAction({
    input: z.intersection(UserInputParamsSchema, UserInputIdentifierSchema),
    handler: async (input) => {
      // TODO: Update user on Auth0
      const updatedDocument = await UserModel.update(input._id, {});

      return transformRawData(updatedDocument);
    },
  }),

  block: defineAction({
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

        // Block the user in Auth0.
        await usersManagement.block(user?.auth0_sub);

        // Update the user's status in the local database.
        const updateResult = await UserModel.block(input._id);

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

  unblock: defineAction({
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
        await usersManagement.unblock(user?.auth0_sub);

        // Update the user's status in the local database.
        const updateResult = await UserModel.unblock(input._id);

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
