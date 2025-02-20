import { lucia } from "$auth";
import auth from "$auth/auth";
import { verifyRequestOrigin } from "lucia";
import { sequence } from "astro/middleware";
import {
  PUBLIC_ROUTES,
  ADMIN_ROUTES,
  SUPER_ADMIN_ROUTES,
  FEATURE_MAP_ROUTES,
  FEATURE_PLAINTEXT_ROUTE,
  FEATURE_SUBTITLES_ROUTE,
  FEATURE_SUBTITLESJSON_ROUTE,
  FEATURE_SUMMARY_ROUTE,
  FEATURE_LARGEFILE_ROUTE,
} from "$constants";
import type { APIContext, MiddlewareNext } from "astro";
import TenantModel from "$data/models/tenant.model";
import { TenantFeature } from "$types/TenantFeature";
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

  const tenant = await TenantModel.get(user.tenant_id.toString());
  if (tenant) {
    context.locals.tenant = tenant;
    context.locals.locale = tenant.default_language || defaultLang;
  }

  return next();
}

async function restrictAccess(context: APIContext, next: MiddlewareNext) {
  // Restrict access for non-admin users
  const matchSAPaths = wildcardMatchInArray(
    context.url.pathname,
    SUPER_ADMIN_ROUTES,
  );
  if (matchSAPaths && !auth.isSuperAdmin(context.locals)) {
    return context.rewrite("/restricted");
  }

  const matchAdminPaths = wildcardMatchInArray(
    context.url.pathname,
    ADMIN_ROUTES,
  );
  if (
    matchAdminPaths &&
    !auth.isSuperAdmin(context.locals) &&
    !auth.isAdmin(context.locals)
  ) {
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

  // Ensure that blocked users are restricted from accessing the admin area
  if (context.locals.user?.blocked && context.url.pathname !== "/api/logout") {
    return context.redirect(
      `/error?error=account_blocked&error_description=Your account has been temporarily blocked. Please contact support.`,
    );
  }

  // Check included features
  for (const [key, paths] of Object.entries(FEATURE_MAP_ROUTES)) {
    const matchAudioToTextPaths = wildcardMatchInArray(
      context.url.pathname,
      paths,
    );
    let hasAccess = false;
    if (context.locals.tenant?.included_features?.length) {
      hasAccess = context.locals.tenant.included_features.some(
        (item) => item.name == (key as TenantFeature),
      );
    }
    if (context.url.pathname === FEATURE_PLAINTEXT_ROUTE) {
      hasAccess =
        context.locals.tenant.transcriptions?.plaintext?.enabled ?? true;
    } else if (context.url.pathname === FEATURE_SUBTITLES_ROUTE) {
      hasAccess =
        context.locals.tenant.transcriptions?.subtitles?.enabled ?? true;
    } else if (context.url.pathname === FEATURE_SUBTITLESJSON_ROUTE) {
      hasAccess =
        context.locals.tenant.transcriptions?.subtitlesjson?.enabled ?? true;
    } else if (context.url.pathname === FEATURE_SUMMARY_ROUTE) {
      hasAccess =
        context.locals.tenant.transcriptions?.summary?.enabled ?? true;
    } else if (context.url.pathname === FEATURE_LARGEFILE_ROUTE) {
      hasAccess =
        context.locals.tenant.transcriptions?.largefile?.enabled ?? true;
    }

    if (matchAudioToTextPaths && !hasAccess) {
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
