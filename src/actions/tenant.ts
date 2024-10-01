import { defineAction } from "astro:actions";
import { z } from "astro:schema";
import tenantModel, { type Tenant } from "$data/models/tenant.model";
import { transformDataToArray } from "$utils/transformDataToArray";

const TenantInputParamsSchema = z.object({
  name: z.string(),
  org_name: z.string(),
  theme: z.string().optional(),
  primary_color: z.string().optional(),
  openai_api_key: z.string().optional(),
});

const TenantInputIdentifierSchema = z.object({
  _id: z.string(),
});

export const tenant = {
  list: defineAction({
    handler: async (input) => {
      const data = await tenantModel.list();
      return transformDataToArray(data);
    },
  }),
  create: defineAction({
    input: TenantInputParamsSchema,
    handler: async (input) => {
      const tenant: Tenant = input;
      const insertResult = await tenantModel.create(tenant);
      return transformDataToArray(insertResult);
    },
  }),
  update: defineAction({
    input: z.intersection(TenantInputParamsSchema, TenantInputIdentifierSchema),
    handler: async (input) => {
      const tenant: Tenant = input;
      const insertResult = await tenantModel.create(tenant);
      return transformDataToArray(insertResult);
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
