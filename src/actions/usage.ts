import { defineAction } from "astro:actions";
import { z } from "zod";
import dayjs from "dayjs";
import type { UsageOverview, UsageRow } from "$types/UsageTracking";
import { transformRawData } from "$utils/transformRawData";
import TenantModel from "$data/models/tenant.model";
import UsageLogModel from "$data/models/usageLog.model";
import { calculateUsage, sumCreditsUsed } from "$utils/usageCalculator";

export const usage = {
  usageSummary: defineAction({
    input: z.object({
      tenant_id: z.string(),
      month: z.string(),
    }),
    handler: async (input) => {
      const { tenant_id: tenantId, month } = input;

      const tenant = await TenantModel.get(tenantId);
      if (!tenant) {
        throw new Error("Tenant does not exist.");
      }

      const formattedMonth = month.replace(/(\d{2})-(\d{4})/, "$2-$1");
      const monthName = dayjs(formattedMonth, "MM-YYYY").format("MMMM YYYY");
      const usageCursor = await UsageLogModel.listUsageSummary(tenantId, month);
      const usages = await usageCursor.toArray();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const usageData: UsageRow[] = calculateUsage(usages);
      const totalCreditsUsed = sumCreditsUsed(usageData);

      const overview: UsageOverview = {
        tenant: tenant.name,
        month: monthName,
        creditsUsed: totalCreditsUsed,
      };
      const results = {
        overview,
        data: usageData,
      };

      return transformRawData(results);
    },
  }),
};
