import { defineAction } from "astro:actions";
import { z } from "zod";
import tenantModel, { type Tenant } from "$data/models/tenant.model";
import { transformDataToArray } from "$utils/transformDataToArray";
import organizationsManagement, {
  type PostOrganizationsRequest,
  type PatchOrganizationsByIdOperationRequest,
  type PatchOrganizationsByIdRequest,
} from "$data/auth0/organizations-manager";

const TenantInputParamsSchema = z.object({
  name: z.string(),
  org_name: z.string(),
  default_language: z.string().optional(),
  theme: z.string().optional(),
  primary_color: z.string().optional(),
  openai_api_key: z.string().optional(),
});

const TenantInputIdentifierSchema = z.object({
  _id: z.string(),
});

export const tenant = {
  get: defineAction({
    input: TenantInputIdentifierSchema,
    handler: async (input) => {
      const data = await tenantModel.get(input._id);
      return transformDataToArray(data);
    },
  }),

  list: defineAction({
    handler: async (input) => {
      const data = await tenantModel.list();
      return transformDataToArray(data);
    },
  }),

  create: defineAction({
    input: TenantInputParamsSchema,
    handler: async (input) => {
      // create new organization on auth0
      const bodyParameters: PostOrganizationsRequest = {
        name: input.org_name,
        display_name: input.name,
      };
      const organizationResult =
        await organizationsManagement.create(bodyParameters);

      // store tenant on mongodb
      const { id: organizationId } = organizationResult.data;
      const tenant: Tenant = { ...input, ...{ org_id: organizationId } };
      const insertResult = await tenantModel.create(tenant);

      return transformDataToArray(insertResult);
    },
  }),

  update: defineAction({
    input: z.intersection(TenantInputParamsSchema, TenantInputIdentifierSchema),
    handler: async (input) => {
      // update tenant on mongodb
      const tenant: Tenant = input;
      const updatedDocument = await tenantModel.update(input._id, tenant);

      // update existing organization on auth0
      const requestParameters: PatchOrganizationsByIdOperationRequest = {
        id: updatedDocument?.org_id,
      };
      const bodyParameters: PatchOrganizationsByIdRequest = {
        name: input.org_name,
        display_name: input.name,
      };
      await organizationsManagement.update(requestParameters, bodyParameters);

      return transformDataToArray(updatedDocument);
    },
  }),

  archive: defineAction({
    input: TenantInputIdentifierSchema,
    handler: async (input) => {
      const updateResult = await tenantModel.archive(input._id);
      return transformDataToArray(updateResult);
    },
  }),
};
