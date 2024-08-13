import { nanoid } from "nanoid";
import { SignJWT } from "jose";
import type { APIRoute } from "astro";
import { TOKEN } from "$constants";
import UserModel from "$data/models/user.model";
import crypto from "node:crypto";

const verify = (password: string, hash: string) =>
  new Promise((resolve, reject) => {
    const [salt, key] = hash.split(".");
    const keyBuffer = Buffer.from(key, "hex");

    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(crypto.timingSafeEqual(keyBuffer, derivedKey));
    });
  });

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
        status: 400,
      });
    }
    const password = (formData.get("password") as string) || "";

    const user = await UserModel.get(email);

    if (user && (await verify(password, user.password))) {
      const token = await new SignJWT({ userId: user._id, username: user.username, tenantId: user.tenant_id})
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
        error: error,
      }),
      {
        status: 500,
      },
    );
  }
};
