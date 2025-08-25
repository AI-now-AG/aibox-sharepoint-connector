import { auth0, lucia } from "$auth";
import { decodeJwt } from "jose";
import type { APIContext } from "astro";
import UserModel, { assignPermissions } from "$data/models/user.model";
import { z } from "zod";
import log from "$utils/log";
import TenantModel from "$data/models/tenant.model";
import { UserRole } from "$types/Users";
import { AUTH0_SESSION_STATE } from "$constants";

const Auth0JWTSchema = z.object({
  sub: z.string().min(24),
  org_id: z.string().min(2),
  org_name: z.string().min(2),
  email: z.string().email(),
  nickname: z.string(),
  picture: z.string().url(),
  name: z.string(),
  "ainow/roles": z.array(z.nativeEnum(UserRole)),
  email_verified: z.boolean(),
  logins_count: z.number(),
});

export async function GET(context: APIContext): Promise<Response> {
  log.d(context.url.searchParams.toString(), "Callback search params");
  const code = context.url.searchParams.get("code");
  const state = context.url.searchParams.get("state");
  const storedState = context.cookies.get(AUTH0_SESSION_STATE)?.value ?? null;

  // *INFO: Redirect to 500 error page if any error occur
  if (context.url.searchParams.has("error")) {
    const error = context.url.searchParams.get("error");
    const description = context.url.searchParams.get("error_description");
    return context.redirect(
      `/error?error=${error}&error_description=${description}`,
    );
  }

  // *INFO: Ensure the callback has code and valid state
  if (!code || !state || !storedState || state !== storedState) {
    log.e({ code, state, storedState }, "missing required params");
    return context.redirect(
      `/error?error=Error&error_description=We couldn't verify your session. Please try again.`,
    );
  }

  const token = await auth0(context.url.origin).validateAuthorizationCode(
    code,
    null,
  );

  const decoded = decodeJwt(token.idToken());
  const auth0User = Auth0JWTSchema.safeParse(decoded);
  if (auth0User.error) {
    log.e(
      auth0User.error,
      "Decoded id token does not contain the required fields",
    );
    return new Response(null, {
      status: 400,
    });
  }

  // TODO: Fetch logo from auth0 org
  const auth0_tenant_id = auth0User.data.org_id;
  const tenant = await TenantModel.getById(auth0_tenant_id);
  if (!tenant) {
    log.e("Tenant not found");
    return new Response(null, {
      status: 400,
    });
  }

  // Get the user's roles
  const roles = auth0User.data["ainow/roles"];

  const accessToken = token.accessToken();
  //console.log("Auth0 accessToken", accessToken);
  // TODO: Sync current user from Auth0 to aibox
  const userId = await UserModel.upsertByAuth0Sub(auth0User.data.sub, {
    tenant_id: tenant._id,
    auth0_sub: auth0User.data.sub,
    username: auth0User.data.nickname,
    name: auth0User.data.name,
    email: auth0User.data.email,
    picture: auth0User.data.picture,
    roles,
    permissions: assignPermissions(roles),
    logins_count: auth0User.data.logins_count,
    email_verified: auth0User.data.email_verified,
    last_login: new Date().toISOString(),
    auth0_access_token: accessToken,
  });

  const session = await lucia.createSession(userId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);

  context.cookies.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );

  return context.redirect("/");
}
