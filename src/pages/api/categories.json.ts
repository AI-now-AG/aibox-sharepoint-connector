import type { APIRoute } from "astro";
import { addCategory, categories } from "$data/models/category.model";

export const GET: APIRoute = async () => {
  try {
    const result = await categories();
    console.log(result);
    return new Response(
      JSON.stringify({
        message: "Category added",
        categories: result,
      }),
      {
        status: 200,
      },
    );
  } catch (error) {
    console.debug(error);

    return new Response(
      JSON.stringify({
        message: "Fetch category failed....",
        error: error,
      }),
      {
        status: 500,
      },
    );
  }
};

export const POST: APIRoute = async (ctx) => {
  const params = await ctx.request.json();
  try {
    if (params.title && params.group) {
      const groups = params.group.map((title: string) => ({
        title,
      }));

      await addCategory({ title: params.title, groups });

      return new Response(
        JSON.stringify({
          message: "Category added",
        }),
        {
          status: 200,
        },
      );
    } else {
      return new Response(
        JSON.stringify({
          message: "Error while add the Category",
        }),
        {
          status: 400,
        },
      );
    }
  } catch (error) {
    console.debug(error);

    return new Response(
      JSON.stringify({
        message: "Add new category failed....",
        error: error,
      }),
      {
        status: 500,
      },
    );
  }
};
