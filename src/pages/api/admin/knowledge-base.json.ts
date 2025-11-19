import type { APIContext, APIRoute } from "astro";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET: APIRoute = async (ctx: APIContext) => {
  return new Response(JSON.stringify([]));
};
