import type { APIRoute } from "astro";
import { categories } from "$data/models/category.model";

export const GET: APIRoute = async (ctx) => {
    try {
        const result = await categories();
        console.log(result)
        return new Response(
            JSON.stringify({
                message: "Category added",
                categories: result
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
