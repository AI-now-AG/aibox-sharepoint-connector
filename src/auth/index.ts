import { Lucia } from "lucia";
import { adapter } from "./db";
import { Auth0 } from "arctic";

import type { UserDoc } from "./db";
import type { ObjectId } from "mongodb";

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
      username: attributes.username,
      tenant_id: attributes.tenant_id,
      email: attributes.email,
    };
  },
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: Omit<UserDoc, "_id">;
    UserId: ObjectId;
  }
}

export const auth0 = new Auth0(
  "https://ainow.eu.auth0.com",
  import.meta.env.AUTH0_CLIENT_ID,
  import.meta.env.AUTH0_CLIENT_SECRET,
  "http://localhost:4321/login/auth0/callback",
);
