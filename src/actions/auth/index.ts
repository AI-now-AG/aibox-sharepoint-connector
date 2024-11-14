import management from "$data/auth0/management-client";
import UserModel from "$data/models/user.model";
import log from "$utils/log";
import { defineAction, type ActionAPIContext } from "astro:actions";
import { ProfileUpdateSchema } from "./schema/profile-update.schema";

export const auth = {
  updateProfile: defineAction({
    input: ProfileUpdateSchema,
    handler: async (input, context: ActionAPIContext): Promise<void> => {
      try {
        const { name } = input;
        const id = context.locals.user.id;
        const sub = context.locals.user.auth0_sub;
        await Promise.all([
          UserModel.update(id, { name }),
          management.users.update({ id: sub }, { name }),
        ]);
      } catch (error) {
        log.e(error, "Failed to update user profile");
        throw error;
      }
    },
  }),
};
