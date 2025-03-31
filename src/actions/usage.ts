import { defineAction } from "astro:actions";
import { z } from "zod";
import { transformRawData } from "$utils/transformRawData";
import TenantModel, { type Tenant } from "$data/models/tenant.model";
import UsageLogModel from "$data/models/usageLog.model";
import MonthlyUsageModel from "$data/models/monthlyUsage.model";

const PRICING: Record<string, { input: number; output: number }> = {
  "openai:gpt-4o": { input: 0.00001, output: 0.00003 },
  "azure_openai:gpt-4o": { input: 0.000011, output: 0.000031 },
  "perplexity:sonar": { input: 0.000005, output: 0.000015 },
};

const MonthlyUsageInputSchema = z.object({
  tenant_id: z.string(),
});

interface GetMonthlyUsageOutput {
  imageDalle: {
    todayAmount: number;
    thisMonthAmount: number;
    availableAmount: number;
    limitRequests: number;
    extraRequest: number;
  };
  imageFlux: {
    todayAmount: number;
    thisMonthAmount: number;
    availableAmount: number;
    limitRequests: number;
    extraRequest: number;
  };
}

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

  getMonthlyImageUsage: defineAction({
    input: MonthlyUsageInputSchema,
    handler: async (
      input: z.infer<typeof MonthlyUsageInputSchema>,
    ): Promise<GetMonthlyUsageOutput> => {
      const { tenant_id: tenantId } = input;

      // Query the monthly_usages collection for the specified tenant_id and month
      const monthlyUsage =
        await MonthlyUsageModel.findOrCreateMonthlyUsage(tenantId);

      if (!monthlyUsage) {
        // If no record is found, return default values
        return {
          imageDalle: {
            todayAmount: 0,
            thisMonthAmount: 0,
            availableAmount: 0,
            limitRequests: 0,
            extraRequest: 0,
          },
          imageFlux: {
            todayAmount: 0,
            thisMonthAmount: 0,
            availableAmount: 0,
            limitRequests: 0,
            extraRequest: 0,
          },
        };
      }

      // Extract usage data for imageDalle and imageFlux
      const imageDalle = monthlyUsage.services?.imageDalle || {};
      const imageFlux = monthlyUsage.services?.imageFlux || {};

      // Calculate available amounts
      const imageDalleAvailable =
        (imageDalle.limitRequests || 0) +
        (imageDalle.extraAmount || 0) -
        (imageDalle.usedRequests || 0);
      const imageFluxAvailable =
        (imageFlux.limitRequests || 0) +
        (imageFlux.extraAmount || 0) -
        (imageFlux.usedRequests || 0);

      // Define the current date (today) and the start/end of the month
      const today = new Date(); // Current date (e.g., 2025-03-27)
      today.setHours(0, 0, 0, 0); // Start of the day
      const endOfDay = new Date(today.getTime());
      endOfDay.setHours(23, 59, 59, 999); // End of today

      // Query Dalle 3 for today
      const todayQueryDalle3 = {
        tenant_id: tenantId,
        provider: "openai",
        model: "dall-e-3",
        type: "image",
        created_at: {
          $gte: today,
          $lte: endOfDay,
        },
      };

      const totalRequestsTodayDalle3 =
        await UsageLogModel.countDocuments(todayQueryDalle3);

      // Query Flux Dev for today
      const todayQueryFluxDev = {
        tenant_id: tenantId,
        provider: "flux",
        model: "fal-ai/flux/dev",
        type: "image",
        created_at: {
          $gte: today,
          $lte: endOfDay,
        },
      };

      const totalRequestsTodayFluxDev =
        await UsageLogModel.countDocuments(todayQueryFluxDev);

      // Return the combined data
      return {
        imageDalle: {
          todayAmount: totalRequestsTodayDalle3,
          thisMonthAmount: imageDalle.usedRequests || 0,
          availableAmount: Math.max(0, imageDalleAvailable), // Ensure available amount is not negative
          limitRequests: imageDalle.limitRequests || 0,
          extraRequest: imageDalle.extraAmount || 0,
        },
        imageFlux: {
          todayAmount: totalRequestsTodayFluxDev,
          thisMonthAmount: imageFlux.usedRequests || 0,
          availableAmount: Math.max(0, imageFluxAvailable), // Ensure available amount is not negative
          limitRequests: imageFlux.limitRequests || 0,
          extraRequest: imageFlux.extraAmount || 0,
        },
      };
    },
  }),
};
