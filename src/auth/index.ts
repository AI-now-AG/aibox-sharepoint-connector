import { Auth0 } from "arctic";
import { MongodbAdapter } from "@lucia-auth/adapter-mongodb";
import { Lucia, TimeSpan } from "lucia";
import {
  collection as userCollection,
  type User,
} from "$data/models/user.model";
import type { ObjectId } from "mongodb";
import { collection as sessionCollection } from "$data/models/session.model";

// export const adapter = new MongodbAdapter(sessionCollection, userCollection);

// 🔧 Create a subclass that disables auto-extension
class NoExtendMongoAdapter extends MongodbAdapter {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateSessionExpiration(sessionId: string, expiresAt: Date) {
    // 🚫 Do nothing, prevents auto-extension
    return;
  }
}

// use your subclass
const adapter = new NoExtendMongoAdapter(sessionCollection, userCollection);

export const lucia = new Lucia(adapter, {
  sessionExpiresIn: new TimeSpan(15, "m"),
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
      auth0_access_token: attributes.auth0_access_token,
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
