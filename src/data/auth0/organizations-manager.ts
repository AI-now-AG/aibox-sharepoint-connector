import {
  type DeleteEnabledConnectionsByConnectionIdRequest,
  type PatchOrganizationsByIdOperationRequest,
  type PatchOrganizationsByIdRequest,
  type PostEnabledConnectionsOperationRequest,
  type PostEnabledConnectionsRequest,
  type PostOrganizationsRequest,
} from "auth0";
import management from "$data/auth0/management-client";

export type {
  PostOrganizationsRequest,
  PatchOrganizationsByIdRequest,
  PostEnabledConnectionsOperationRequest,
  PostEnabledConnectionsRequest,
  DeleteEnabledConnectionsByConnectionIdRequest,
} from "auth0";

export const create = async (bodyParameters: PostOrganizationsRequest) => {
  try {
    return await management.organizations.create(bodyParameters);
  } catch (err) {
    console.log("auth0: create organization error", err);
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
    console.log("auth0: update organization error", err);
    throw err;
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
    console.log("auth0: add enabled connection error", err);
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
    console.log("auth0: delete enabled connection error", err);
    throw err;
  }
};

export default {
  create,
  update,
  addEnabledConnection,
  deleteEnabledConnection,
};
