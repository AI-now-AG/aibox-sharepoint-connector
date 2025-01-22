import management from "$data/auth0/management-client";
import type {
  GetOrganizationsByIdRequest,
  DeleteEnabledConnectionsByConnectionIdRequest,
  GetOrganizationMemberRolesRequest,
  PatchOrganizationsByIdOperationRequest,
  PatchOrganizationsByIdRequest,
  PostEnabledConnectionsOperationRequest,
  PostEnabledConnectionsRequest,
  PostOrganizationsRequest,
  PostMembersOperationRequest,
  PostMembersRequest,
  PostOrganizationMemberRolesOperationRequest,
  PostOrganizationMemberRolesRequest,
  DeleteOrganizationsByIdRequest,
  DeleteOrganizationMemberRolesOperationRequest,
  DeleteOrganizationMemberRolesRequest,
} from "auth0";

export const get = async (id: string) => {
  try {
    const requestParameters: GetOrganizationsByIdRequest = {
      id,
    };
    return await management.organizations.get(requestParameters);
  } catch (err) {
    console.error(`auth0: get organization ${id} error`, err);
    throw err;
  }
};

export const create = async (bodyParameters: PostOrganizationsRequest) => {
  try {
    return await management.organizations.create(bodyParameters);
  } catch (err) {
    console.error("auth0: create organization error", err);
    throw err;
  }
};

export const update = async (
  organizationId: string,
  bodyParameters: PatchOrganizationsByIdRequest,
) => {
  try {
    const requestParameters: PatchOrganizationsByIdOperationRequest = {
      id: organizationId,
    };
    return await management.organizations.update(
      requestParameters,
      bodyParameters,
    );
  } catch (err) {
    console.error("auth0: update organization error", err);
    throw err;
  }
};

export const deleteTenant = async (userId: string) => {
  try {
    const requestParameters: DeleteOrganizationsByIdRequest = {
      id: userId,
    };

    return await management.organizations.delete(requestParameters);
  } catch (error) {
    console.error("auth0: delete organization error", error);
    throw error;
  }
};

export const addEnabledConnection = async (
  organizationId: string,
  connectionId: string,
) => {
  try {
    const requestParameters: PostEnabledConnectionsOperationRequest = {
      id: organizationId,
    };
    const bodyParameters: PostEnabledConnectionsRequest = {
      connection_id: connectionId,
    };

    return await management.organizations.addEnabledConnection(
      requestParameters,
      bodyParameters,
    );
  } catch (err) {
    console.error("auth0: add enabled connection error", err);
    throw err;
  }
};

export const deleteEnabledConnection = async (
  organizationId: string,
  connectionId: string,
) => {
  try {
    const requestParameters: DeleteEnabledConnectionsByConnectionIdRequest = {
      id: organizationId,
      connectionId,
    };

    return await management.organizations.deleteEnabledConnection(
      requestParameters,
    );
  } catch (err) {
    console.error("auth0: delete enabled connection error", err);
    throw err;
  }
};

export const getMemberRoles = async (id: string, userId: string) => {
  try {
    const parameters: GetOrganizationMemberRolesRequest = {
      id,
      user_id: userId,
    };
    return await management.organizations.getMemberRoles(parameters);
  } catch (err) {
    console.error("auth0: get organization member's roles error", err);
    throw err;
  }
};

export const addMembers = async (id: string, members: string[]) => {
  try {
    const requestParameters: PostMembersOperationRequest = {
      id,
    };
    const bodyParameters: PostMembersRequest = {
      members,
    };

    return await management.organizations.addMembers(
      requestParameters,
      bodyParameters,
    );
  } catch (err) {
    console.error("auth0: organization add members error", err);
    throw err;
  }
};

export const addMemberRoles = async (
  id: string,
  userId: string,
  roles: string[],
) => {
  try {
    const requestParameters: PostOrganizationMemberRolesOperationRequest = {
      id,
      user_id: userId,
    };
    const bodyParameters: PostOrganizationMemberRolesRequest = {
      roles,
    };

    return await management.organizations.addMemberRoles(
      requestParameters,
      bodyParameters,
    );
  } catch (err) {
    console.error("auth0: organization add member roles error", err);
    throw err;
  }
};

export const deleteMemberRoles = async (
  id: string,
  userId: string,
  roles: string[],
) => {
  try {
    const requestParameters: DeleteOrganizationMemberRolesOperationRequest = {
      id,
      user_id: userId,
    };
    const bodyParameters: DeleteOrganizationMemberRolesRequest = {
      roles,
    };

    return await management.organizations.deleteMemberRoles(
      requestParameters,
      bodyParameters,
    );
  } catch (err) {
    console.error("auth0: organization add member roles error", err);
    throw err;
  }
};

export default {
  get,
  create,
  update,
  deleteTenant,
  addEnabledConnection,
  deleteEnabledConnection,
  getMemberRoles,
  addMembers,
  addMemberRoles,
  deleteMemberRoles,
};
