import type { APIRoute } from "astro";
import CategoryModel from "$data/models/category.model";

export const GET: APIRoute = async () => {
  try {
    const result = await CategoryModel.list();

    return new Response(JSON.stringify(await result.toArray()));
  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({
        message: "Error while fetching categories",
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
      /*
      const groups = params.group.map((title: string) => ({
        title,
      }));

      await CategoryModel.add({ title: params.title, groups });
      */

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
