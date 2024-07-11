import { defineMiddleware } from "astro/middleware";
import { getUserByEmailAndPassword } from './models/user.model';

// const DEFAULT_USER = "preview";
// const DEFAULT_PASS = "aiderdaus";

export const onRequest = defineMiddleware(async (context, next) => {
  // If a basic auth header is present, it wil take the string form: "Basic authValue"
  const basicAuth = context.request.headers.get("authorization");

  if (basicAuth) {
    // Get the auth value from string "Basic authValue"
    const authValue = basicAuth.split(" ")[1] ?? "username:password";

    // Decode the Base64 encoded string via atob (https://developer.mozilla.org/en-US/docs/Web/API/atob)
    // Get the username and password. NB: the decoded string is in the form "username:password"
    const [username, pwd] = atob(authValue).split(":");

    if (!username || !pwd) {
      // Redirect to login page if no credentials provided
      return Response.redirect('/login');
    }

    //const user = import.meta.env.BASIC_AUTH_USER || DEFAULT_USER;
    //const pass = import.meta.env.BASIC_AUTH_PASS || DEFAULT_PASS;
    const user = await getUserByEmailAndPassword(username, pwd);
    if (!user) {
      // Redirect to login page if invalid credentials
      return Response.redirect('/login');
    }

    // Login successful, continue to protected page
    return next();
  }

  return Response.redirect('/login');
  // return new Response("Auth required", {
  //   status: 401,
  //   headers: {
  //     "WWW-authenticate": 'Basic realm="Restricted Area"',
  //   },
  // });
});
