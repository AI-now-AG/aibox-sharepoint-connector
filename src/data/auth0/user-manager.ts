import management from "$data/auth0/management-client";
import { type GetUserRolesRequest, type GetUsersRequest } from "auth0";

export const getAllUsers = async (parameters: GetUsersRequest) => {
  try {
    return await management.users.getAll(parameters);
  } catch (error) {
    console.log("auth0: Get All User exception", error);
    throw error;
  }
};

// This get Role which NOT RELATED to Orgainziation (using user id)
export const getUserRoles = async (parameters: GetUserRolesRequest) => {
  try {
    return await management.users.getRoles(parameters);
  } catch (error) {
    console.log("auth0: Get User Role exception", error);
    throw error;
  }
};

export default {
  getAllUsers,
  getUserRoles,
};
