import type { APIRoute } from "astro";
import dayjs from "dayjs";
import { writeToString } from "fast-csv";
import GlobalPromptModel from "$data/models/globalPrompt.model";
import type { Group } from "$data/models/category.model";
import { CsvColumn, type CsvRowRaw } from "$types/PromptCsv";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET: APIRoute = async () => {
  const filename = `Global-Prompts-Export-${dayjs().format("YYYY-MM-DD")}.csv`;

  try {
    // Fetch your MongoDB data (Prompts by tenant)
    const prompts = await GlobalPromptModel.listForExport();

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
        [CsvColumn.PromptTool]: prompt.promptTool,
        [CsvColumn.ReasoningEffort]: prompt.reasoningEffort,
        [CsvColumn.TextVerbosity]: prompt.textVerbosity,
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
