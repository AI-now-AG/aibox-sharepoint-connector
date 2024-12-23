import type { APIContext, APIRoute } from "astro";
import { format, writeToString } from "fast-csv";
import PromptModel from "$data/models/prompt.model";

export const GET: APIRoute = async (ctx) => {
  const { tenant_id: tenantId } = ctx.locals.user;

  try {
    // Fetch your MongoDB data
    const promptsCursor = await PromptModel.listForExportByTenant(tenantId);
    const prompts = await promptsCursor.toArray();
    console.log("prompts", prompts);

    // Generate the CSV string using fast-csv
    const csvString = await writeToString(prompts, { headers: true });

    // Set the response headers to prompt a download
    return new Response(csvString, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="export.csv"',
      },
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return new Response("Error fetching data", { status: 500 });
  }
};
