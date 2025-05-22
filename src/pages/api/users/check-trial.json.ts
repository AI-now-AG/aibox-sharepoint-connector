import type { APIRoute } from "astro";
import UserModel from "$data/models/user.model";
import TenantModel from "$data/models/tenant.model";
import { z } from "zod";

const CheckTrialRequestSchema = z.object({
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
    const { id: userId } = CheckTrialRequestSchema.parse(params);

    // Fetch user by ID
    const user = await UserModel.get(userId);
    if (!user) {
      return Response.json(
        { error: "User not exist" },
        {
          status: 404,
        },
      );
    }

    // Fetch the tenant associated with the user
    const tenant = await TenantModel.get(user.tenant_id);
    if (!tenant) {
      return Response.json(
        { error: "Tenant not exist" },
        {
          status: 404,
        },
      );
    }

    // Return trial status and other attributes
    return Response.json(
      {
        trial: tenant.is_trial === true,
        user: {
          blocked: user.blocked,
          verified: user.email_verified,
        },
      },
      { status: 200 },
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
    console.error("Error checking trial status:", error);
    return Response.json(
      { error: "Internal server error" },
      {
        status: 500,
      },
    );
  }
};
