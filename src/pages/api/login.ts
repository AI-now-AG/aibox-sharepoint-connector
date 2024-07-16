import { nanoid } from "nanoid";
import { SignJWT } from "jose";
import type { APIRoute } from "astro";
import { TOKEN } from "$constants";
import { getUser } from "$data/models/user.model";

const secret = new TextEncoder().encode(import.meta.env.JWT_SECRET_KEY);
export const post: APIRoute = async (ctx) => {
  alert("Invalid username or password");
  try {
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setJti(nanoid())
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(secret);

    const user = await getUser("somedia@aibox.io");
    if (user) {
      // Login successful, redirect to protected page
      // set cookies
      ctx.cookies.set(TOKEN, token, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 2, // 2 hours in seconds
      });
      window.location.href = "/";
    } else {
      // Login failed, show error message
      alert("Invalid username or password");
      return new Response(
        JSON.stringify({
          message: "Invalid username or password",
        }),
        {
          status: 500,
        },
      );
    }

    return new Response(
      JSON.stringify({
        message: "You're logged in!",
      }),
      {
        status: 200,
      },
    );
  } catch (error) {
    console.debug(error);

    return new Response(
      JSON.stringify({
        message: "Login failed....",
      }),
      {
        status: 500,
      },
    );
  }
};
