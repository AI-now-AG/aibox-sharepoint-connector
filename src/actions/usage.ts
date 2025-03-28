import { defineAction } from "astro:actions";
import { z } from "zod";
import { transformRawData } from "$utils/transformRawData";
import TenantModel, { type Tenant } from "$data/models/tenant.model";
import UsageModel from "$data/models/usage.model";

const PRICING: Record<string, { input: number; output: number }> = {
  "openai:gpt-4o": { input: 0.00001, output: 0.00003 },
  "azure_openai:gpt-4o": { input: 0.000011, output: 0.000031 },
  "perplexity:sonar": { input: 0.000005, output: 0.000015 },
};

// Define the input schema for the new action using zod
const countImageRequestsInputSchema = z.object({
  tenant_id: z.string(),
  provider: z.string(),
  model: z.string(),
});

// Define the output type for the new action
interface CountImageRequestsOutput {
  total_requests_this_month: number;
  total_requests_today: number;
}

export const usage = {
  usageSummary: defineAction({
    handler: async (input) => {
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
      const usageCursor = await UsageModel.listUsageSummary();
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

  countImageGenerationRequests: defineAction({
    input: countImageRequestsInputSchema,
    handler: async (
      input: z.infer<typeof countImageRequestsInputSchema>,
    ): Promise<CountImageRequestsOutput> => {
      const { tenant_id, provider, model } = input;

      // Define the current date (today) and the start/end of the month
      const today = new Date(); // Current date (e.g., 2025-03-27)
      today.setHours(0, 0, 0, 0); // Start of the day

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1); // First day of the month
      const endOfMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      ); // Last day of the month
      const endOfDay = new Date(today.getTime());
      endOfDay.setHours(23, 59, 59, 999); // End of today

      // Query for the current month
      const monthQuery = {
        tenant_id: tenant_id, // Assuming tenant_id is stored as a string in the DB
        provider: provider,
        model: model,
        type: "image",
        created_at: {
          $gte: startOfMonth,
          $lte: endOfMonth,
        },
      };

      const totalRequestsMonth = await UsageModel.countDocuments(monthQuery);

      // Query for today
      const todayQuery = {
        tenant_id: tenant_id,
        provider: provider,
        model: model,
        type: "image",
        created_at: {
          $gte: today,
          $lte: endOfDay,
        },
      };

      const totalRequestsToday = await UsageModel.countDocuments(todayQuery);

      // Return the results
      return {
        total_requests_this_month: totalRequestsMonth,
        total_requests_today: totalRequestsToday,
      };
    },
  }),
};
