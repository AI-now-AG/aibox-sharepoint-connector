import { auth0, lucia } from "$auth";
import { decodeJwt } from "jose";

import type { APIContext } from "astro";
import userModel from "$data/models/user.model";
import { z } from "zod";
import tenantModel from "$data/models/tenant.model";

const Auth0JWTSchema = z.object({
  sub: z.string().min(24),
  org_name: z.string().min(2),
  "ainow/roles": z.array(z.string().min(1)),
  email: z.string().email(),
  nickname: z.string(),
  picture: z.string().url(),
});

export async function GET(context: APIContext): Promise<Response> {
  console.log("searchParams", context.url.searchParams);
  console.log("state", context.cookies.get("auth0_state"));

  const code = context.url.searchParams.get("code");
  const state = context.url.searchParams.get("state");
  const storedState = context.cookies.get("auth0_state")?.value ?? null;

  if (!code || !state || !storedState || state !== storedState) {
    console.debug("missing required params");
    return new Response(null, {
      status: 400,
    });
  }

  const tokens = await auth0(context.url.origin).validateAuthorizationCode(
    code,
  );
  const decoded = decodeJwt(tokens.idToken);
  console.log("decoded", decoded);

  const userData = Auth0JWTSchema.safeParse(decoded);
  if (userData.error) {
    console.debug(
      "Decoded id token does not contain the required fields",
      userData.error,
    );
    return new Response(null, {
      status: 400,
    });
  }

  const existingUser = await userModel.getAuth0Sub(userData.data.sub);
  console.log("existingUser", existingUser);

  if (existingUser) {
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
  const tenant = await tenantModel.getByName(userData.data.org_name);
  if (!tenant) {
    console.debug("Tenant not found");
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
    roles: userData.data["ainow/roles"], // This is currently the role name, should be ID in the future
    created_at: new Date(),
    updated_at: new Date(),
  });

  console.log("newUser", newUser);

  const session = await lucia.createSession(newUser.insertedId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);

  context.cookies.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );

  return context.redirect("/");
}
