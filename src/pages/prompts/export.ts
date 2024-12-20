import type { APIContext, APIRoute } from "astro";
import { writeToString } from "fast-csv";
import CategoryModel from "$data/models/category.model";

export const GET: APIRoute = async (ctx) => {
  const { tenant_id: tenantId } = ctx.locals.user;

  try {
    // Fetch your MongoDB data
    const categoriesCursor = await CategoryModel.listByTenant(tenantId);
    const categories = await categoriesCursor.toArray();

    // Generate the CSV string using fast-csv
    const csvString = await writeToString(categories, { headers: true });

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
