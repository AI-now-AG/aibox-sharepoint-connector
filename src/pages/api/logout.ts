import { lucia } from "$auth";

import type { APIRoute } from "astro";

export const GET: APIRoute = async (context) => {
  if (!context.locals.session) {
    return new Response(null, {
      status: 401,
    });
  }

  const { locale } = context.locals;

  await lucia.invalidateSession(context.locals.session.id);
  
  const sessionCookie = lucia.createBlankSessionCookie();
  context.cookies.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );
  const tenant = import.meta.env.AUTH0_TENANT || "ainow";
  const redirectUrl = context.url.origin + `/logout/success?lang=${locale}`;

  return context.redirect(
    //"https://ainow.eu.auth0.com/v2/logout?returnTo=http://localhost:4321",
    `https://${tenant}.eu.auth0.com/v2/logout?returnTo=${redirectUrl}`,
  );
};
