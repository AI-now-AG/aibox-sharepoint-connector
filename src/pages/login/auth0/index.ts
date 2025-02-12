import { generateState } from "arctic";
import { auth0 } from "$auth";

import type { APIContext } from "astro";

export async function GET(context: APIContext): Promise<Response> {
  const state = generateState();
  const url = await auth0(context.url.origin).createAuthorizationURL(
    state,
    null,
    ["openid", "profile", "email", "ainow/roles"],
  );

  context.cookies.set("auth0_state", state, {
    path: "/",
    secure: import.meta.env.PROD,
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  return context.redirect(url.toString());
}
