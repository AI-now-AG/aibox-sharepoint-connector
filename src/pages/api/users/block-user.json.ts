import type { APIRoute } from "astro";
import UserModel from "$data/models/user.model";
import { z } from "zod";

const BlockUserRequestSchema = z.object({
  id: z.string(),
});

//const SECRET_API_TOKEN = import.meta.env.API_SECRET;

export const POST: APIRoute = async (ctx) => {
  // Check Bearer token
  const authHeader = ctx.request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // const token = authHeader.split(" ")[1];
  // if (token !== SECRET_API_TOKEN) {
  //   return Response.json({ error: "Forbidden" }, { status: 403 });
  // }

  try {
    // Parse and validate input
    const params = await ctx.request.json();
    const { id: userId } = BlockUserRequestSchema.parse(params);

    // Attempt to block user
    await UserModel.update(userId, { blocked: true });
    return new Response(
      JSON.stringify({ message: "User blocked successfully" }),
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error blocking user:", error);
    return new Response(JSON.stringify({ error: "Failed to block user" }), {
      status: 500,
    });
  }
};
