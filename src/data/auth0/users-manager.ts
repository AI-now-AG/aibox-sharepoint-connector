import { managementClient } from "$data/auth0/client";
import type {
  GetUsersByIdRequest,
  GetUsersRequest,
  GetUserRolesRequest,
  UserCreate,
  PatchUsersByIdRequest,
  UserUpdate,
  DeleteUsersByIdRequest,
  GetUsersByEmailRequest,
  PostAuthenticationMethodsOperationRequest,
  PostAuthenticationMethodsRequest,
} from "auth0";

export const getAllUsers = async (parameters: GetUsersRequest) => {
  try {
    return await managementClient.users.getAll(parameters);
  } catch (error) {
    console.error("auth0: get all user error", error);
    throw error;
  }
};

export const get = async (userId: string) => {
  try {
    const requestParameters: GetUsersByIdRequest = {
      id: userId,
    };

    return await managementClient.users.get(requestParameters);
  } catch (error) {
    console.error("auth0: get user error", error);
    throw error;
  }
};

export const getByEmail = async (email: string) => {
  try {
    const requestParameters: GetUsersByEmailRequest = {
      email: email,
    };

    return managementClient.usersByEmail.getByEmail(requestParameters);
  } catch (error) {
    console.error("auth0: get user error", error);
    throw error;
  }
};

// This get Role which NOT RELATED to Orgainziation (using user id)
export const getUserRoles = async (parameters: GetUserRolesRequest) => {
  try {
    return await managementClient.users.getRoles(parameters);
  } catch (error) {
    console.error("auth0: get user role error", error);
    throw error;
  }
};

export const create = async (bodyParameters: UserCreate) => {
  try {
    return await managementClient.users.create(bodyParameters);
  } catch (error) {
    console.error("auth0: create user error", error);
    throw error;
  }
};

export const update = async (userId: string, bodyParameters: UserUpdate) => {
  try {
    const requestParameters: PatchUsersByIdRequest = {
      id: userId,
    };

    return await managementClient.users.update(
      requestParameters,
      bodyParameters,
    );
  } catch (error) {
    console.error("auth0: update user error", error);
    throw error;
  }
};

export const deleteUser = async (userId: string) => {
  try {
    const requestParameters: DeleteUsersByIdRequest = {
      id: userId,
    };

    return await managementClient.users.delete(requestParameters);
  } catch (error) {
    console.error("auth0: delete user error", error);
    throw error;
  }
};

export const block = async (userId: string) => {
  const bodyParameters: UserUpdate = {
    blocked: true,
  };
  return update(userId, bodyParameters);
};

export const unblock = async (userId: string) => {
  const bodyParameters: UserUpdate = {
    blocked: false,
  };
  return update(userId, bodyParameters);
};

export const createAuthenticationMethod = async (
  userId: string,
  bodyParameters: PostAuthenticationMethodsRequest,
) => {
  try {
    const requestParameters: PostAuthenticationMethodsOperationRequest = {
      id: userId,
    };

    return await managementClient.users.createAuthenticationMethod(
      requestParameters,
      bodyParameters,
    );
  } catch (error) {
    console.error("auth0: create authentication method error", error);
    throw error;
  }
};

export default {
  getAllUsers,
  get,
  getByEmail,
  getUserRoles,
  create,
  update,
  deleteUser,
  block,
  unblock,
  createAuthenticationMethod,
};
