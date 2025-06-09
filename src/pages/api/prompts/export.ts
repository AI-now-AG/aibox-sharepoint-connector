import type { APIContext, APIRoute } from "astro";
import dayjs from "dayjs";
import { writeToString } from "fast-csv";
import PromptModel from "$data/models/prompt.model";
import type { Group } from "$data/models/category.model";
import { CsvColumn, type CsvRowRaw } from "$types/PromptCsv.types";

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

      // Returning the data formatted for CSV
      return {
        [CsvColumn.Title]: prompt.title,
        [CsvColumn.Description]: prompt.description,
        [CsvColumn.Instruction]: prompt.prompt,
        [CsvColumn.Category]: category,
        [CsvColumn.Group]: group,
        [CsvColumn.Model]: prompt.model,
        [CsvColumn.PredefinedInput]: prompt.predefined_input,
      };
    });

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
