import { Auth0 } from "arctic";
import { MongodbAdapter } from "@lucia-auth/adapter-mongodb";
import { Lucia } from "lucia";
import {
  collection as userCollection,
  type User,
} from "$data/models/user.model";
import type { ObjectId } from "mongodb";
import { collection as sessionCollection } from "$data/models/session.model";

export const adapter = new MongodbAdapter(sessionCollection, userCollection);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: import.meta.env.PROD,
    },
  },
  getUserAttributes: (attributes) => {
    // This defines what values will be returned (and attached to the request context)
    // when validating a session
    return {
      auth0_sub: attributes.auth0_sub,
      username: attributes.username,
      name: attributes.name,
      tenant_id: attributes.tenant_id,
      email: attributes.email,
      email_verified: attributes.email_verified,
      picture: attributes.picture,
      roles: attributes.roles,
      permissions: attributes.permissions,
      navState: attributes.navState,
      blocked: attributes.blocked,
      logins_count: attributes.logins_count,
      tours: attributes.tours,
      auth0AccessToken: attributes.auth0AccessToken,
    };
  },
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: Omit<User, "_id">;
    UserId: ObjectId;
  }
}

export const auth0 = (basepath: string) => {
  const domain = import.meta.env.AUTH0_DOMAIN || "auth.test.aibox-app.com";
  return new Auth0(
    domain,
    import.meta.env.AUTH0_CLIENT_ID,
    import.meta.env.AUTH0_CLIENT_SECRET,
    `${basepath}/login/auth0/callback`,
  );
};

export async function requestAccessToken() {
  try {
    const response = await fetch(`https://${import.meta.env.AUTH0_TENANT}.eu.auth0.com/oauth/token`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        client_id: import.meta.env.AZURE_AUTH0_CLIENT_ID,
        client_secret:
         import.meta.env.AZURE_AUTH0_CLIENT_SECRET,
        audience: import.meta.env.AZURE_AUTH0_AUDIENCE,
        grant_type: "client_credentials",
      }),
    });

    if (!response.ok) {
      throw new Error("Request access Auth0 access token failed");
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Error fetching token:", error);
    return undefined;
  }
}
