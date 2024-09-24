import { lucia } from "$auth";
import { verifyRequestOrigin } from "lucia";
import { defineMiddleware } from "astro/middleware";
import { PUBLIC_ROUTES } from "$constants";

export const onRequest = defineMiddleware(async (context, next) => {
  // Ignore auth validation for public routes
  if (PUBLIC_ROUTES.includes(context.url.pathname)) {
    return next();
  }

  // Basic CSRF protection
  if (context.request.method !== "GET") {
    const originHeader = context.request.headers.get("Origin");
    const hostHeader = context.request.headers.get("Host");
    if (
      !originHeader ||
      !hostHeader ||
      !verifyRequestOrigin(originHeader, [hostHeader])
    ) {
      return new Response(null, {
        status: 403,
      });
    }
  }

  const sessionRequired = () => {
    if (context.url.pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({ message: "unauthorized" }), {
        status: 401,
      });
    }

    return context.redirect("/login/auth0");
  };

  const sessionId = context.cookies.get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId) return sessionRequired();

  const { session, user } = await lucia.validateSession(sessionId);
  if (!session) return sessionRequired();

  if (session && session.fresh) {
    const sessionCookie = lucia.createSessionCookie(session.id);
    context.cookies.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );
  }

  context.locals.session = session;
  context.locals.user = user;
  return next();
});
