import { generateState } from "arctic";
import { auth0 } from "$auth";
import type { APIContext } from "astro";
import { AUTH0_SESSION_STATE, AUTH_AUTHORIZE_SCOPES } from "$constants";

export async function GET(context: APIContext): Promise<Response> {
  const state = generateState();
  const url = auth0(context.url.origin).createAuthorizationURL(
    state,
    null,
    AUTH_AUTHORIZE_SCOPES,
  );

  context.cookies.set(AUTH0_SESSION_STATE, state, {
    path: "/",
    secure: import.meta.env.PROD,
    httpOnly: true,
    maxAge: 60 * 60,
    sameSite: "lax",
  });

  return context.redirect(url.toString());
}
