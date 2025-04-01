import { defineAction } from "astro:actions";
import { transformRawData } from "$utils/transformRawData";
import TenantModel, { type Tenant } from "$data/models/tenant.model";
import UsageLogModel from "$data/models/usageLog.model";

const PRICING: Record<string, { input: number; output: number }> = {
  "openai:gpt-4o": { input: 0.00001, output: 0.00003 },
  "azure_openai:gpt-4o": { input: 0.000011, output: 0.000031 },
  "perplexity:sonar": { input: 0.000005, output: 0.000015 },
};

export const usage = {
  usageSummary: defineAction({
    handler: async () => {
      // Step 1: Build tenant_id -> name map
      const tenants = await TenantModel.list();
      const tenantMap = tenants.reduce(
        (map: Record<string, string>, t: Tenant) => {
          map[t?._id?.toString()] = t.name;
          return map;
        },
        {} as Record<string, string>,
      );

      // Step 2: Aggregate usage
      const usageCursor = await UsageLogModel.listUsageSummary();
      const usages = await usageCursor.toArray();

      // Step 3: Transform + enrich with cost + tenant name
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results = usages.map((item: any) => {
        const { tenant_id, provider, model, type } = item._id;

        const tenantIdStr = tenant_id.toString();
        const tenantName = tenantMap[tenantIdStr] || tenantIdStr;
        const pricingKey = `${provider}:${model}`;
        const pricing = PRICING[pricingKey] || { input: 0, output: 0 };

        const inputCost = item.total_input * pricing.input;
        const outputCost = item.total_output * pricing.output;

        return {
          tenant: tenantName,
          type,
          provider,
          model,
          total_input: item.total_input,
          total_output: item.total_output,
          cost: +(inputCost + outputCost).toFixed(4),
        };
      });

      return transformRawData(results);
    },
  }),
};
