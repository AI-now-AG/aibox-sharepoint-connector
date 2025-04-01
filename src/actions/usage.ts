import { defineAction } from "astro:actions";
import { z } from "zod";
import { transformRawData } from "$utils/transformRawData";
import TenantModel from "$data/models/tenant.model";
import UsageLogModel from "$data/models/usageLog.model";

export const usage = {
  usageSummary: defineAction({
    input: z.object({
      tenant_id: z.string(),
      month: z.string(),
    }),
    handler: async (input) => {
      const { tenant_id: tenantId, month } = input;

      const tenant = await TenantModel.get(tenantId);
      const usageCursor = await UsageLogModel.listUsageSummary(tenantId, month);
      const usages = await usageCursor.toArray();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results = usages.map((item: any) => {
        const { provider, model, type } = item._id;
        const tenantName = tenant?.name;

        return {
          tenant: tenantName,
          type,
          provider,
          model,
          total_input: item.total_input,
          total_output: item.total_output,
        };
      });

      return transformRawData(results);
    },
  }),
};
