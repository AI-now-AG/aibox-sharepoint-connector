import { managementClient } from "$data/auth0/client";
import type {
  PostEmailVerificationRequest,
  PostPasswordChangeRequest,
} from "auth0";

export const createVerifyEmailTicket = async (
  bodyParameters: PostEmailVerificationRequest,
) => {
  try {
    return await managementClient.tickets.verifyEmail(bodyParameters);
  } catch (error) {
    console.error("auth0: create verify email ticket error", error);
    throw error;
  }
};

export const createPasswordResetTicket = async (
  bodyParameters: PostPasswordChangeRequest,
) => {
  try {
    return await managementClient.tickets.changePassword(bodyParameters);
  } catch (error) {
    console.error("auth0: create password reset ticket error", error);
    throw error;
  }
};

export default {
  createVerifyEmailTicket,
  createPasswordResetTicket,
};
