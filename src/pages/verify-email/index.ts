import { sendVerificationEmail } from "$utils/auth0Auth";
import type { APIContext } from "astro";

export async function GET(context: APIContext): Promise<Response> {
  try {
    const auth0_sub = context.locals.user.auth0_sub;
    const email = context.locals.user.email;

    await sendVerificationEmail(auth0_sub, email);
  } catch (error) {
    console.error("Error sending verification email:", error);
  } finally {
    return context.redirect("/");
  }
}
