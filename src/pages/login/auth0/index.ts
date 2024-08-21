import { generateState } from "arctic";
import { auth0 } from "$auth";

import type { APIContext } from "astro";

export async function GET(context: APIContext): Promise<Response> {
  const state = generateState();
  console.log("state", state);
  const url = await auth0.createAuthorizationURL(state);
  console.log("url", url);

  context.cookies.set("auth0_state", state, {
    path: "/",
    secure: import.meta.env.PROD,
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  return context.redirect(url.toString());
}
