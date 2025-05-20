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
  const domain = import.meta.env.AUTH0_DOMAIN || "auth.test.aibox-app.com";
  const redirectUrl = context.url.origin + `/logout/success?lang=${locale}`;

  return context.redirect(
    `https://${domain}/v2/logout?returnTo=${redirectUrl}`,
  );
};
