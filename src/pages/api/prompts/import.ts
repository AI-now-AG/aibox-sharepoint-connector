import type { APIContext, APIRoute } from "astro";
import { parseString } from "fast-csv";
import PromptModel from "$data/models/prompt.model";

export const POST: APIRoute = async (ctx: APIContext) => {
  try {
    const request:Request = ctx.request;

    // Parse the incoming FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), { status: 400 });
    }

    // Read the file content into memory
    const fileContent = await file.text(); // This reads the entire file into a string
    console.log('fileContent', fileContent);

    // Parse the CSV content
    const rows: Record<string, any>[] = []; // Array to store the parsed rows
    await new Promise<void>((resolve, reject) => {
      parseString(fileContent, { headers: true }) // Pass the CSV string and options
        .on('data', (row: Record<string, any>) => {
          rows.push(row);
        })
        .on('end', () => resolve())
        .on('error', (error) => reject(error));
    });

    console.log('rows', rows);

    // Respond with the parsed rows
    return new Response(JSON.stringify({ data: rows }), { status: 200 });
  } catch (error) {
    console.error("Error fetching data:", error);
    return new Response("Error fetching data", { status: 500 });
  }
};
