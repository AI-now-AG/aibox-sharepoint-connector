import { defineAction } from "astro:actions";
import { managementClient } from "$data/auth0/client";
import UserModel from "$data/models/user.model";
import log from "$utils/log";
import { ProfileUpdateSchema } from "./schema/profile-update.schema";

export const auth = {
  updateProfile: defineAction({
    input: ProfileUpdateSchema,
    handler: async (input, context): Promise<void> => {
      try {
        const { id, auth0_sub: auth0Sub } = context.locals.user;
        const { name } = input;
        await Promise.all([
          UserModel.update(id, { name }),
          managementClient.users.update({ id: auth0Sub }, { name }),
        ]);
      } catch (error) {
        log.e(error, "Failed to update user profile");
        throw error;
      }
    },
  }),
};
