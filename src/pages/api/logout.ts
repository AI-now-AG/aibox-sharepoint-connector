import { lucia } from "$auth";

import type { APIRoute } from "astro";

export const GET: APIRoute = async (context) => {
  if (!context.locals.session) {
    return new Response(null, {
      status: 401,
    });
  }

  await lucia.invalidateSession(context.locals.session.id);

  const sessionCookie = lucia.createBlankSessionCookie();
  context.cookies.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );

  return context.redirect(
    //"https://ainow.eu.auth0.com/v2/logout?returnTo=http://localhost:4321",
    "https://ainow.eu.auth0.com/v2/logout",
  );
};
