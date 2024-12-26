import type { APIContext, APIRoute } from "astro";
import { writeToString } from "fast-csv";
import PromptModel from "$data/models/prompt.model";

export const POST: APIRoute = async (ctx: APIContext) => {
  try {
    const {request} = ctx;
    const formData = await request.formData();

    console.log('formData', formData);

    return new Response(
      JSON.stringify({
        success: true,
      }),
    );
  } catch (error) {
    console.error("Error fetching data:", error);
    return new Response("Error fetching data", { status: 500 });
  }
};
