import { lucia } from "$auth";
import auth from "$auth/auth";
import { verifyRequestOrigin } from "lucia";
import { sequence } from "astro/middleware";
import {
  PUBLIC_ROUTES,
  ADMIN_ROUTES,
  SUPER_ADMIN_ROUTES,
  FEATURE_MAP_ROUTES,
  SUPER_USER_ROUTES,
  SKIP_CHEKING_ONBOARDING_ROUTES,
} from "$constants";
import type { APIContext, MiddlewareNext } from "astro";
import TenantModel from "$data/models/tenant.model";
import UserModel from "$data/models/user.model";
import { TenantFeature } from "$types/TenantFeature";
import { defaultLang } from "$i18n/ui";
import { setLanguage } from "$i18n/utils";
import { wildcardMatchInArray } from "$utils/wildcardMatch";

async function requestOrigin(context: APIContext, next: MiddlewareNext) {
  const path = context.url.pathname;
  const isAudioConversion = path.includes("/api/audio/convert-to-mono");

  // Set CORS headers for audio conversion endpoint
  if (isAudioConversion) {
    if (context.request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Max-Age": "86400", // 24 hours
        },
      });
    }

    // For actual requests, let the response handle CORS headers
    const response = await next();
    const newHeaders = new Headers(response.headers);
    newHeaders.set("Access-Control-Allow-Origin", "*");

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  }

  // Regular CSRF protection for other endpoints
  if (context.request.method !== "GET" && !isAudioConversion) {
    const originHeader = context.request.headers.get("Origin");
    const hostHeader = context.request.headers.get("Host");

    // Allow non-browser clients that don't send `Origin` (like Postman)
    if (originHeader) {
      // Only verify if Origin is present (i.e. browser request)
      if (!hostHeader || !verifyRequestOrigin(originHeader, [hostHeader])) {
        return new Response(null, {
          status: 403,
        });
      }
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
    const contentType = context.request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return new Response(
        JSON.stringify({
          code: "UNAUTHORIZED",
          message: "Authentication required. Please log in to continue.",
        }),
        {
          status: 401,
        },
      );
    }

    return context.redirect("/login/auth0");
  };

  const sessionId = context.cookies.get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId) return sessionRequired();

  const { session, user } = await lucia.validateSession(sessionId);
  if (!session) return sessionRequired();

  // Skip cookie refresh — we use fixed-lifetime sessions (no auto-extension)
  // if (session && session.fresh) {
  //   const sessionCookie = lucia.createSessionCookie(session.id);
  //   context.cookies.set(
  //     sessionCookie.name,
  //     sessionCookie.value,
  //     sessionCookie.attributes,
  //   );
  // }

  context.locals.session = session;
  context.locals.user = user;

  const tenant = await TenantModel.get(user.tenant_id.toString());
  if (tenant) {
    context.locals.tenant = tenant;
    context.locals.locale = tenant.default_language || defaultLang;
  }

  return next();
}

async function onboardingCheck(context: APIContext, next: MiddlewareNext) {
  const skipCheckSubscriptionPath = wildcardMatchInArray(
    context.url.pathname,
    SKIP_CHEKING_ONBOARDING_ROUTES,
  );

  if (skipCheckSubscriptionPath) {
    return next();
  }

  const userId = context.locals.user?.id?.toString() || "";
  const user = await UserModel.get(userId);
  if (!user) {
    return next();
  } else {
    if (user.created_by_admin != undefined && user.created_by_admin !== null && user.created_by_admin !== true) {// Self-registration flow
      if (user.logins_count <= 1) {// First login
        return context.redirect("/subscription");
      } else if (!user.is_complete_self_registration) {// Incomplete subscription
        return context.redirect("/subscription");
      }
    }
  }

  return next();
}

async function restrictAccess(context: APIContext, next: MiddlewareNext) {
  // Restrict access for non Super Admin users
  const matchSAPaths = wildcardMatchInArray(
    context.url.pathname,
    SUPER_ADMIN_ROUTES,
  );
  if (matchSAPaths && !auth.isSuperAdmin(context.locals)) {
    return context.rewrite("/restricted");
  }

  // Restrict access for non Admin users
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

  // Restrict access for non Super User users
  const matchSuperUserPaths = wildcardMatchInArray(
    context.url.pathname,
    SUPER_USER_ROUTES,
  );
  if (
    matchSuperUserPaths &&
    !auth.isSuperAdmin(context.locals) &&
    !auth.isAdmin(context.locals) &&
    !auth.isSuperUser(context.locals)
  ) {
    return context.rewrite("/restricted");
  }

  // Prevent archived tenant member login
  if (
    context.locals.tenant?.active == false &&
    context.url.pathname !== "/api/logout"
  ) {
    return context.redirect(`/error?error=tenant_inactive`);
  }

  // Ensure that blocked users are restricted from accessing the admin area
  if (context.locals.user?.blocked && context.url.pathname !== "/api/logout") {
    return context.redirect(`/error?error=account_blocked`);
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
  onboardingCheck,
  restrictAccess,
  initI18n,
);
