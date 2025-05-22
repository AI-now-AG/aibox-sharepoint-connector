import type { APIRoute } from "astro";
import UserModel from "$data/models/user.model";
import { z } from "zod";

const BlockUserRequestSchema = z.object({
  id: z.string(),
});

const SECRET_API_TOKEN = import.meta.env.API_SECRET_KEY;

export const POST: APIRoute = async (ctx) => {
  // Unified check for Authorization header and token
  const authHeader = ctx.request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (token !== SECRET_API_TOKEN) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse and validate input
    const params = await ctx.request.json();
    const { id: userId } = BlockUserRequestSchema.parse(params);

    // Attempt to block user
    await UserModel.update(userId, { blocked: true });
    return Response.json(
      { message: "User blocked successfully" },
      {
        status: 200,
      },
    );
  } catch (error) {
    // Input validation failed (e.g. missing or wrong type)
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid input", details: error.flatten() },
        { status: 400 },
      );
    }

    // Unexpected system error
    console.error("Error blocking user:", error);
    return Response.json(
      { error: "Failed to block user" },
      {
        status: 500,
      },
    );
  }
};
