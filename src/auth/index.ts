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
      picture: attributes.picture,
      roles: attributes.roles,
      permissions: attributes.permissions,
      navState: attributes.navState,
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
  const tenant = import.meta.env.AUTH0_TENANT || "ainow";
  return new Auth0(
    `https://${tenant}.eu.auth0.com`,
    import.meta.env.AUTH0_CLIENT_ID,
    import.meta.env.AUTH0_CLIENT_SECRET,
    `${basepath}/login/auth0/callback`,
  );
};
