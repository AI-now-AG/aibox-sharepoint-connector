import type { APIContext, APIRoute } from "astro";
import dayjs from "dayjs";
import { writeToString } from "fast-csv";
import PromptModel, { type Prompt } from "$data/models/prompt.model";

export const GET: APIRoute = async (ctx) => {
  const { tenant_id: tenantId } = ctx.locals.user;
  const filename = `Prompts-Export-${dayjs().format("YYYY-MM-DD")}.csv`;

  try {
    // Fetch your MongoDB data
    const promptsCursor = await PromptModel.listForExportByTenant(tenantId);
    const prompts = await promptsCursor.toArray();

    // Prepare the CSV data with appropriate headers
    const csvData = prompts.map((prompt) => {
      const category = prompt.category?.title;
      const findGroup = prompt.category?.groups?.find((item: any) => {
        return item._id?.toString() == prompt.group?.toString();
      });
      const group = findGroup ? findGroup.title : "";

      return {
        title: prompt.title,
        description: prompt.description,
        category,
        group,
        knowledgebase: prompt.knowledgebase
          ? prompt.knowledgebase.join("; ")
          : "",
        created_at: dayjs(prompt.created_at).format("YYYY-MM-DD HH:mm:ss"),
        updated_at: dayjs(prompt.updated_at).format("YYYY-MM-DD HH:mm:ss"),
      };
    });
    console.log("prompts csvData", { prompts, csvData });

    // Generate the CSV string using fast-csv
    const csvString = await writeToString(csvData, { headers: true });

    // Set the response headers to prompt a download
    return new Response(csvString, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return new Response("Error fetching data", { status: 500 });
  }
};
