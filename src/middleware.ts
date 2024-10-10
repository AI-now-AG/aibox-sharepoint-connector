import { lucia } from "$auth";
import auth from "$auth/auth";
import { verifyRequestOrigin } from "lucia";
import { sequence } from "astro/middleware";
import { PUBLIC_ROUTES, SUPER_ADMIN_ROUTES } from "$constants";
import type { APIContext, MiddlewareNext } from "astro";
import tenantModel from "$data/models/tenant.model";
import { defaultLang } from "$i18n/ui";
import { setLanguage } from "$i18n/utils";
import wildcardMatch from "$utils/wildcardMatch";

async function requestOrigin(context: APIContext, next: MiddlewareNext) {
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
  return next();
}

async function authenticate(context: APIContext, next: MiddlewareNext) {
  // Ignore auth validation for public routes
  if (PUBLIC_ROUTES.includes(context.url.pathname)) {
    return next();
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

  // fetch tenant
  const tenant = await tenantModel.get(user.tenant_id.toString());
  if (tenant) {
    context.locals.tenant = tenant;
    context.locals.locale = tenant.default_language || defaultLang;
  }

  return next();
}

async function restrictAccess(context: APIContext, next: MiddlewareNext) {
  const matchPaths = SUPER_ADMIN_ROUTES.filter((path) => {
    return wildcardMatch(context.url.pathname, path);
  });
  if (matchPaths.length && !auth.isSuperAdmin(context.locals)) {
    return context.rewrite("/restricted");
  }

  return next();
}

async function initI18n(context: APIContext, next: MiddlewareNext) {
  // set locale from preferred locale of the user
  const preferredLocale = context.preferredLocale;
  if (preferredLocale) {
    setLanguage(preferredLocale);
  }

  // set locale from tenant settings
  const tenantLanguage = context.locals.tenant?.default_language;
  if (tenantLanguage) {
    setLanguage(tenantLanguage);
  }

  return next();
}

export const onRequest = sequence(
  requestOrigin,
  authenticate,
  restrictAccess,
  initI18n,
);
