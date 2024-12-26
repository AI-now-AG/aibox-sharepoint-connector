import { defineAction } from "astro:actions";
import {} from "auth0";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { transformRawData } from "$utils/transformRawData";
import {
  Permission,
  UserFilterParamsSchema,
  UserRole,
  UserTenantFilterParamsSchema,
} from "$data/models/user.model";
import userModel from "$data/models/user.model";

const UserInputParamsSchema = z.object({
  user_id: z.instanceof(ObjectId),
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

const UserInputIdentifierSchema = z.object({
  _id: z.string(),
});

export const user = {
  get: defineAction({
    input: UserInputIdentifierSchema,
    handler: async (input) => {
      const data = await userModel.get(input._id);
      return transformRawData(data);
    },
  }),

  list: defineAction({
    input: UserFilterParamsSchema,
    handler: async (input) => {
      const data = await userModel.list(input);
      return transformRawData(data);
    },
  }),

  listByTeant: defineAction({
    input: UserTenantFilterParamsSchema,
    handler: async (input) => {
      const data = await userModel.listByTenant(input);
      return transformRawData(data);
    },
  }),

  create: defineAction({
    input: UserInputParamsSchema,
    handler: async () => {
      const insertResult = await userModel.add({
        auth0_sub: "",
        username: "",
        email: "",
        roles: [],
        permissions: [],
        name: "",
        tenant_id: new ObjectId(),
        created_at: new Date(),
        updated_at: new Date(),
      });

      return transformRawData(insertResult);
    },
  }),

  update: defineAction({
    input: z.intersection(UserInputParamsSchema, UserInputIdentifierSchema),
    handler: async (input) => {
      const updatedDocument = await userModel.update(input._id, {
        auth0_sub: "",
        username: "",
        email: "",
        roles: [],
        permissions: [],
        name: "",
        tenant_id: new ObjectId(),
        created_at: new Date(),
        updated_at: new Date(),
      });

      return transformRawData(updatedDocument);
    },
  }),
};
