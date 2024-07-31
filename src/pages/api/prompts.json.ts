import type { APIRoute } from "astro";
import { addPrompt } from "$data/models/prompt.model";

export const POST: APIRoute = async (ctx) => {
    const params = await ctx.request.json();
    try {
        if (params.prompt) {
            const result = await addPrompt(params);

            return new Response(
                JSON.stringify({
                    message: "Prompt added",
                }),
                {
                    status: 200,
                },
            );
        } else {
            return new Response(
                JSON.stringify({
                    message: "Error while add the prompt",
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
                message: "Login failed....",
                error: error,
            }),
            {
                status: 500,
            },
        );
    }
};
