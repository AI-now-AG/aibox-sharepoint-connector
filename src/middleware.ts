import { lucia } from "$auth";
import { verifyRequestOrigin } from "lucia";
import { errors, jwtVerify } from "jose";
import { defineMiddleware } from "astro/middleware";
import { TOKEN, PUBLIC_ROUTES } from "$constants";

const secret = new TextEncoder().encode(import.meta.env.JWT_SECRET_KEY);

const verifyAuth = async (token?: string) => {
  if (!token) {
    return {
      status: "unauthorized",
      msg: "please pass a request token",
    } as const;
  }

  try {
    const jwtVerifyResult = await jwtVerify(token, secret);

    return {
      status: "authorized",
      payload: jwtVerifyResult.payload,
      msg: "successfully verified auth token",
    } as const;
  } catch (err) {
    if (err instanceof errors.JOSEError) {
      return { status: "error", msg: err.message } as const;
    }

    console.debug(err);
    return { status: "error", msg: "could not validate auth token" } as const;
  }
};

export const onRequest = defineMiddleware(async (context, next) => {
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

  const sessionId = context.cookies.get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId) {
    context.locals.user = null;
    context.locals.session = null;
    return next();
  }

  const { session, user } = await lucia.validateSession(sessionId);
  if (session && session.fresh) {
    const sessionCookie = lucia.createSessionCookie(session.id);
    context.cookies.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );
  }
  if (!session) {
    const sessionCookie = lucia.createBlankSessionCookie();
    context.cookies.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );
  }
  context.locals.session = session;
  context.locals.user = user;
  return next();

  // OLD

  // Ignore auth validation for public routes
  if (PUBLIC_ROUTES.includes(context.url.pathname)) {
    return next();
  }

  const token = context.cookies.get(TOKEN)?.value;
  const validationResult = await verifyAuth(token);

  switch (validationResult.status) {
    case "authorized":
      const { payload } = validationResult;
      const { userId, username, tenantId } = payload;
      context.locals.userId = userId as string;
      context.locals.tenantId = tenantId as string;
      context.locals.username = username as string;
      return next();

    case "error":
    case "unauthorized":
      if (context.url.pathname.startsWith("/api/")) {
        return new Response(JSON.stringify({ message: validationResult.msg }), {
          status: 401,
        });
      }
      // otherwise, redirect to the root page for the user to login
      else {
        return Response.redirect(new URL("/login", context.url));
      }

    default:
      return Response.redirect(new URL("/login", context.url));
  }
});
