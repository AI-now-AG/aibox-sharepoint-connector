import { sendVerificationEmail } from "$utils/auth0Auth";
import type { APIContext } from "astro";

export async function GET(context: APIContext): Promise<Response> {
  const {
    auth0_sub: userId,
    email,
    email_verified: emailVerified,
  } = context.locals.user;

  try {
    if (!emailVerified) {
      await sendVerificationEmail(userId, email);
    }
  } catch (error) {
    console.error("Error sending verification email:", error);
  }

  // Redirect back to the previous page (or home if no referer)
  return context.redirect(context.request.headers.get("Referer") || "/");
}
