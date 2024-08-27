import { Lucia } from "lucia";
import { MongodbAdapter } from "@lucia-auth/adapter-mongodb";
import {
  collection as userCollection,
  type User,
} from "$data/models/user.model";
import { collection as sessionCollection } from "$data/models/session.model";
import { Auth0 } from "arctic";

import type { ObjectId } from "mongodb";

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
      username: attributes.username,
      tenant_id: attributes.tenant_id,
      email: attributes.email,
      picture: attributes.picture,
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

console.log("-------");
console.log(import.meta.env.URL);
console.log("-------");

const netlifyHostname =
  (import.meta.env.DEPLOY_URL as string) || "http://localhost:4321";
const hostname = netlifyHostname.includes("main--")
  ? import.meta.env.URL
  : netlifyHostname;

export const auth0 = new Auth0(
  "https://ainow.eu.auth0.com",
  import.meta.env.AUTH0_CLIENT_ID,
  import.meta.env.AUTH0_CLIENT_SECRET,
  `${hostname}/login/auth0/callback`,
);
