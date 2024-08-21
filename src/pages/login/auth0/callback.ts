import { auth0, lucia } from "$auth";
import { OAuth2RequestError } from "arctic";
import { User, Session, type UserDoc } from "$auth/db";
import { generateId } from "lucia";

import type { APIContext } from "astro";

export async function GET(context: APIContext): Promise<Response> {
  console.log("searchParams", context.url.searchParams);
  console.log("state", context.cookies.get("github_oauth_state"));

  const code = context.url.searchParams.get("code");
  const state = context.url.searchParams.get("state");
  const storedState = context.cookies.get("github_oauth_state")?.value ?? null;

  if (!code || !state || !storedState || state !== storedState) {
    return new Response(null, {
      status: 400,
    });
  }
  return new Response(null, {
    status: 200,
  });

  /*
  try {
    const tokens = await auth0.validateAuthorizationCode(code);
    const githubUserResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });
    const githubUser: GitHubUser = await githubUserResponse.json();
    const existingUser = db
      .prepare("SELECT * FROM user WHERE github_id = ?")
      .get(githubUser.id) as UserDoc | undefined;

    const existingUser = User.findOne({ auth0_id:   })

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

    const userId = generateId(15);
    db.prepare(
      "INSERT INTO user (id, github_id, username) VALUES (?, ?, ?)",
    ).run(userId, githubUser.id, githubUser.login);
    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    context.cookies.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );
    return context.redirect("/");
  } catch (e) {
    if (
      e instanceof OAuth2RequestError &&
      e.message === "bad_verification_code"
    ) {
      // invalid code
      return new Response(null, {
        status: 400,
      });
    }
    return new Response(null, {
      status: 500,
    });
  }
  */
}

interface Auth0User {
  id: string;
  login: string;
}
