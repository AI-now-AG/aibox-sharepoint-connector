import type { APIContext } from "astro";

export async function GET(context: APIContext): Promise<Response> {
  // TODO: Handle sending the verification email
  return context.redirect("/");
}
