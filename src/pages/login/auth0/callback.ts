import { auth0, lucia } from "$auth";
import { decodeJwt } from "jose";

import type { APIContext } from "astro";
import userModel, {
  assignPermissions,
  UserRole,
} from "$data/models/user.model";
import { z } from "zod";
import tenantModel from "$data/models/tenant.model";
import log from "$utils/log";

const Auth0JWTSchema = z.object({
  sub: z.string().min(24),
  org_name: z.string().min(2),
  "ainow/roles": z.array(z.nativeEnum(UserRole)),
  email: z.string().email(),
  nickname: z.string(),
  picture: z.string().url(),
});

export async function GET(context: APIContext): Promise<Response> {
  log.d(context.url.searchParams, "searchParams");
  log.d(context.cookies.get("auth0_state"), "state");

  const code = context.url.searchParams.get("code");
  const state = context.url.searchParams.get("state");
  const storedState = context.cookies.get("auth0_state")?.value ?? null;

  // Redirect to 500 error page if any error occur
  if (context.url.searchParams.has("error")) {
    const error = context.url.searchParams.get("error");
    const description = context.url.searchParams.get("error_description");
    return context.redirect(`/500?code=${error}&description=${description}`);
  }

  // Ensure the callback has code and valid state
  if (!code || !state || !storedState || state !== storedState) {
    log.e({ code, state, storedState }, "missing required params");
    return new Response(null, {
      status: 400,
    });
  }

  const tokens = await auth0(context.url.origin).validateAuthorizationCode(
    code,
  );
  const decoded = decodeJwt(tokens.idToken);
  log.d(decoded, "decoded");

  const userData = Auth0JWTSchema.safeParse(decoded);
  if (userData.error) {
    log.e(
      userData.error,
      "Decoded id token does not contain the required fields",
    );
    return new Response(null, {
      status: 400,
    });
  }
  const roles = userData.data["ainow/roles"];

  const existingUser = await userModel.getAuth0Sub(userData.data.sub);
  log.d(existingUser, "existingUser");

  if (existingUser) {
    // Prevent archived tenant member login
    const tenant = await tenantModel.get(existingUser.tenant_id.toString());
    if (tenant && tenant.active == false) {
      return context.redirect(
        `/500?code=tenant_inactive&description=Sorry, the tenant associated with your account is currently inactive. Please contact the tenant administrator or support for assistance.`,
      );
    }

    // Update roles
    await userModel.updateRole(userData.data.sub, roles);

    // Create session
    const session = await lucia.createSession(existingUser._id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    context.cookies.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    return context.redirect("/");
  }

  // TODO: fetch logo from auth0 org?
  const orgName = userData.data.org_name;
  const tenant = await tenantModel.getByName(orgName);
  if (!tenant) {
    log.e("Tenant not found");
    return new Response(null, {
      status: 400,
    });
  }

  const newUser = await userModel.add({
    tenant_id: tenant._id,
    auth0_sub: userData.data.sub,
    username: userData.data.nickname,
    email: userData.data.email,
    picture: userData.data.picture,
    roles,
    created_at: new Date(),
    updated_at: new Date(),
    permissions: assignPermissions(roles),
  });

  log.d(newUser, "newUser");

  const session = await lucia.createSession(newUser.insertedId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);

  context.cookies.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );

  return context.redirect("/");
}
