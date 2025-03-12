import { defineAction } from "astro:actions";
import { z } from "zod";
import { managementClient } from "$data/auth0/client";
import UserModel from "$data/models/user.model";
import log from "$utils/log";
import { sendVerificationEmail } from "$utils/auth0Auth";

const ProfileUpdateSchema = z.object({
  name: z.string(),
});

export const auth = {
  emailVerification: defineAction({
    handler: async (input, context): Promise<void> => {
      try {
        const { auth0_sub: userId, email } = context.locals.user;
        await sendVerificationEmail(userId, email);
      } catch (error) {
        log.e(error, "Failed to send verification email");
        throw error;
      }
    },
  }),
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
