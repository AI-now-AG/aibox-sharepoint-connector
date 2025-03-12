import { sendVerificationEmail } from "$utils/auth0Auth";
import type { APIContext } from "astro";

export async function GET(context: APIContext): Promise<Response> {
  try {
    const userId = context.locals.user.id.toString();
    const email = context.locals.user.email;

    await sendVerificationEmail(userId, email);
  } catch (error) {
    console.error("Error sending verification email:", error);
  } finally {
    return context.redirect("/");
  }
}
