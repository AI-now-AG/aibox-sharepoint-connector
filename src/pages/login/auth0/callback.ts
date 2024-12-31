import { auth0, lucia } from "$auth";
import { decodeJwt } from "jose";
import type { APIContext } from "astro";
import UserModel, {
  assignPermissions,
  UserRole,
} from "$data/models/user.model";
import { z } from "zod";
import log from "$utils/log";
import TenantModel from "$data/models/tenant.model";
import userManagement from "$data/auth0/user-manager";
import tenantManagement from "$data/auth0/organizations-manager";
import { sendExceptionToSentry } from "$utils/send-exception-to-sentry";

const Auth0JWTSchema = z.object({
  sub: z.string().min(24),
  org_id: z.string().min(2),
  org_name: z.string().min(2),
  email: z.string().email(),
  nickname: z.string(),
  picture: z.string().url(),
  name: z.string(),
  "ainow/roles": z.array(z.nativeEnum(UserRole)),
});

export async function GET(context: APIContext): Promise<Response> {
  log.d(context.url.searchParams.toString(), "Callback search params");
  const code = context.url.searchParams.get("code");
  const state = context.url.searchParams.get("state");
  const storedState = context.cookies.get("auth0_state")?.value ?? null;

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
    return new Response(null, {
      status: 400,
    });
  }

  const token = await auth0(context.url.origin).validateAuthorizationCode(code);
  const decoded = decodeJwt(token.idToken);
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

  const roles = auth0User.data["ainow/roles"];

  // Sync list Users of current Tenant, exlude current logged in user
  let extraUserData = {};
  if (roles && roles.length > 0) {
    let isAdmin = false;
    for (let i = 0; i < roles.length; i++) {
      const role = roles[i];
      if (role == UserRole.SuperAdmin || role == UserRole.Admin) {
        isAdmin = true;
        break;
      }
    }
    if (isAdmin) {
      setTimeout(async () => {
        try {
          log.i(auth0_tenant_id, "auth0_tenant_id");
          const data = await userManagement.getAllUsers({
            q: `organization_id: ${auth0_tenant_id}`,
          });

          const users = data.data ?? [];
          if (users && Array.isArray(users) && users.length > 0) {
            for (let i = 0; i < users.length; i++) {
              const _user = users[i];
              const { identities = [] } = _user;

              const rolesdata = await tenantManagement.getMemberRoles({
                id: auth0_tenant_id,
                user_id: _user.user_id,
              });

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              let _roles: any[] = rolesdata.data ?? [];
              _roles = _roles.map((_role) => {
                return _role.name;
              });
              if (_roles.length == 0) {
                _roles = [UserRole.User];
              }

              if (_user.email != auth0User.data.email) {
                UserModel.upsertByAuth0Sub(_user.user_id, {
                  tenant_id: tenant._id,
                  auth0_sub: _user.user_id,
                  username: _user.nickname,
                  name: _user.name,
                  email: _user.email,
                  picture: _user.picture,
                  roles: _roles,
                  permissions: assignPermissions(_roles),
                  last_login: _user.last_login?.toString(),
                  logins_count: _user.logins_count,
                  email_verified: _user.email_verified,
                  blocked: _user.blocked ? _user.blocked : false,
                  identities,
                });
              } else {
                extraUserData = {
                  ...extraUserData,
                  last_login: _user.last_login?.toString(),
                  logins_count: _user.logins_count,
                  email_verified: _user.email_verified,
                  blocked: _user.blocked ? _user.blocked : false,
                  identities,
                };
              }
            }
          }
        } catch (error) {
          sendExceptionToSentry(error);
        }
      }, 0);
    }
  }

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
    ...extraUserData,
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
