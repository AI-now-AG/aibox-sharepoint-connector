import type { APIContext, APIRoute } from "astro";
import dayjs from "dayjs";
import { writeToString } from "fast-csv";
import PromptModel from "$data/models/prompt.model";
import type { Group } from "$data/models/category.model";
import type { KnowledgeBase } from "$data/models/knowledgeBase.model";
import type { CsvRowRaw } from "$types/prompt-csv.types";

export const GET: APIRoute = async (ctx: APIContext) => {
  const { tenant_id: tenantId } = ctx.locals.user;
  const filename = `Prompts-Export-${dayjs().format("YYYY-MM-DD")}.csv`;

  try {
    // Fetch your MongoDB data (Prompts by tenant)
    const promptsCursor = await PromptModel.listForExportByTenant(tenantId);
    const prompts = await promptsCursor.toArray();

    // Prepare the CSV data with appropriate headers
    const csvData: CsvRowRaw[] = prompts.map((prompt) => {
      const category = prompt.category?.title;
      const findGroup = prompt.category?.groups?.find((item: Group) => {
        return item._id?.toString() == prompt.group?.toString();
      });
      const group = findGroup ? findGroup.title : "";

      // Prepare knowledgebase details
      const knowledgebase = prompt.knowledgebase
        .map((kb: KnowledgeBase) => {
          const { title, description, knowledge_base } = kb;
          const obj = {
            title,
            description,
            knowledge_base,
          };

          const item = [];
          for (const [key, value] of Object.entries(obj)) {
            item.push(`[${key}]: ${value}`);
          }
          return item.join(";\n");
        })
        .join("\n\n[break]\n\n");

      // Returning the data formatted for CSV
      return {
        title: prompt.title,
        description: prompt.description,
        prompt: prompt.prompt,
        category,
        group,
        knowledgebase: knowledgebase,
        created_at: dayjs(prompt.created_at).format("YYYY-MM-DD HH:mm:ss"),
        updated_at: dayjs(prompt.updated_at).format("YYYY-MM-DD HH:mm:ss"),
      };
    });
    //console.log("csvData", { prompts, csvData });

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
    console.error("Error export data:", error);
    return new Response("Error export data", { status: 500 });
  }
};
