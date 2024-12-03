import { defineAction } from "astro:actions";
import management from "$data/auth0/management-client";
import UserModel from "$data/models/user.model";
import log from "$utils/log";
import { ProfileUpdateSchema } from "./schema/profile-update.schema";

export const auth = {
  updateProfile: defineAction({
    input: ProfileUpdateSchema,
    handler: async (input): Promise<void> => {
      try {
        const { id, auth0Sub, name } = input;
        await Promise.all([
          UserModel.update(id, { name }),
          management.users.update({ id: auth0Sub }, { name }),
        ]);
      } catch (error) {
        log.e(error, "Failed to update user profile");
        throw error;
      }
    },
  }),
};
