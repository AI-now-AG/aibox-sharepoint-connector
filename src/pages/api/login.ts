import { nanoid } from "nanoid";
import { SignJWT } from "jose";
import type { APIRoute } from "astro";
import { TOKEN } from "$constants";
import { getUser } from "$data/models/user.model";

const secret = new TextEncoder().encode(import.meta.env.JWT_SECRET_KEY);
export const POST: APIRoute = async (ctx) => {
  const formData = await ctx.request.formData();
  try {
    const email = formData.get("email") as string;
    if (
      typeof email !== "string" ||
      !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)
    ) {
      return new Response(JSON.stringify({ message: "Invalid username" }), {
        status: 400
      });
    }
    const user = await getUser(email);
    if (user) {
      const token = await new SignJWT({})
        .setProtectedHeader({ alg: "HS256" })
        .setJti(nanoid())
        .setIssuedAt()
        .setExpirationTime("2h")
        .sign(secret);
      // Login successful, redirect to authentic page
      // set cookies
      ctx.cookies.set(TOKEN, token, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 2, // 2 hours in seconds
      });
    } else {
      // Login failed, show error message
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
        error: error
      }),
      {
        status: 500,
      },
    );
  }
};
