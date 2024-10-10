import type { APIRoute } from "astro";
import { z } from "zod";
import userModel from "$data/models/user.model";
import tenantModel from "$data/models/tenant.model";

export const GET: APIRoute = async (ctx) => {
  try {
    const email = ctx.url.searchParams.get("email") as string;

    // block user for archived tenant
    const user = await userModel.getByEmail(email);
    console.log("user", { user, email });
    if (user) {
      const tenant = await tenantModel.get(user.tenant_id.toString());
      if (tenant && tenant.active == false) {
        return new Response(
          JSON.stringify({
            is_authorized: false,
          }),
        );
      }
    }

    return new Response(
      JSON.stringify({
        is_authorized: true,
      }),
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        message: "Internal server error",
        error: error,
      }),
      {
        status: 500,
      },
    );
  }
};
