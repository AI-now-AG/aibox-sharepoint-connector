import { lucia } from "$auth";
import auth from "$auth/auth";
import { verifyRequestOrigin } from "lucia";
import { sequence } from "astro/middleware";
import {
  PUBLIC_ROUTES,
  SUPER_ADMIN_ROUTES,
  FEATURE_MAP_ROUTES,
  FEATURE_PLAINTEXT_ROUTE,
  FEATURE_SUBTITLES_ROUTE,
  FEATURE_SUMMARY_ROUTE,
} from "$constants";
import type { APIContext, MiddlewareNext } from "astro";
import tenantModel, { TenantFeature } from "$data/models/tenant.model";
import { defaultLang } from "$i18n/ui";
import { setLanguage } from "$i18n/utils";
import { wildcardMatch, wildcardMatchInArray } from "$utils/wildcardMatch";

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
  if (wildcardMatchInArray(context.url.pathname, PUBLIC_ROUTES)) {
    return next();
  }

  const sessionRequired = () => {
    if (wildcardMatch(context.url.pathname, "/api/*")) {
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
  // Restrict access for non-admin users
  const matchPath = wildcardMatchInArray(
    context.url.pathname,
    SUPER_ADMIN_ROUTES,
  );
  if (matchPath && !auth.isSuperAdmin(context.locals)) {
    return context.rewrite("/restricted");
  }

  // Prevent archived tenant member login
  if (
    context.locals.tenant?.active == false &&
    context.url.pathname !== "/api/logout"
  ) {
    return context.redirect(
      `/error?error=tenant_inactive&error_description=Sorry, the tenant associated with your account is currently inactive. Please contact the tenant administrator or support for assistance.`,
    );
  }

  // Check included features
  for (const [key, paths] of Object.entries(FEATURE_MAP_ROUTES)) {
    const matchPath = wildcardMatchInArray(context.url.pathname, paths);
    let hasAccess = false;
    if (context.locals.tenant?.included_features?.length) {
      hasAccess = context.locals.tenant.included_features.some(
        (item) => item.name == (key as TenantFeature),
      );
    }
    if(context.url.pathname === FEATURE_PLAINTEXT_ROUTE) {
      hasAccess = (context.locals.tenant.transcriptions?.plaintext?.enabled ?? true)
    }
    if(context.url.pathname === FEATURE_SUBTITLES_ROUTE) {
      hasAccess = (context.locals.tenant.transcriptions?.subtitles?.enabled ?? true)
    }
    if(context.url.pathname === FEATURE_SUMMARY_ROUTE) {
      hasAccess = (context.locals.tenant.transcriptions?.summary?.enabled ?? true)
    }

    if (matchPath && !hasAccess) {
      return context.rewrite("/restricted");
    }
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
