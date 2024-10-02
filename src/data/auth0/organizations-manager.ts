import {
  type PatchOrganizationsByIdOperationRequest,
  type PatchOrganizationsByIdRequest,
  type PostOrganizationsRequest,
} from "auth0";
import management from "$data/auth0/management-client";

export type {
  PostOrganizationsRequest,
  PatchOrganizationsByIdOperationRequest,
  PatchOrganizationsByIdRequest,
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
  requestParameters: PatchOrganizationsByIdOperationRequest,
  bodyParameters: PatchOrganizationsByIdRequest,
) => {
  try {
    return await management.organizations.update(
      requestParameters,
      bodyParameters,
    );
  } catch (err) {
    console.log("auth0: update organization error", err);
    throw err;
  }
};

export default {
  create,
  update,
};
