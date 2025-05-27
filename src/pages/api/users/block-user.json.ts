import type { APIRoute } from "astro";
import { client } from "$data/mongodb";
import UserModel from "$data/models/user.model";
import usersManagement from "$data/auth0/users-manager";
import { z } from "zod";

const BlockUserRequestSchema = z.object({
  id: z.string(), // Auth0 user_id
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

  const session = client.startSession();
  session.startTransaction();

  try {
    // Parse and validate input
    const params = await ctx.request.json();
    const { id: userId } = BlockUserRequestSchema.parse(params);

    // Attempt to block user
    const user = await UserModel.getAuth0Sub(userId);
    if (!user) {
      return Response.json(
        { error: "User does not exist" },
        {
          status: 404,
        },
      );
    }

    // block user in Auth0
    await usersManagement.block(user.auth0_sub);

    // update blocked status
    await UserModel.update(user._id, { blocked: true });

    await session.commitTransaction();
    return Response.json(
      { message: "User blocked successfully" },
      {
        status: 200,
      },
    );
  } catch (error) {
    await session.abortTransaction();

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
  } finally {
    session.endSession();
  }
};
