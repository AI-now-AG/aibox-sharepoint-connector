import type { APIRoute } from "astro";
import { updateUserData } from "$data/models/user.model";
import { z } from "zod";

const UpdateNavStateSchema = z.object({
  id: z.string(),
  open: z.boolean(),
});

export const POST: APIRoute = async (ctx) => {
  const params = await ctx.request.json();
  const data = UpdateNavStateSchema.parse(params);

  try {
    const userId = ctx.locals.user.id;
    await updateUserData(userId, data.id, data.open); // Update user's nav state in the database
    return new Response(
      JSON.stringify({ message: "Navigation state updated" }),
      {
        status: 200,
      },
    );
  } catch (error) {
    console.debug(error);
    return new Response(
      JSON.stringify({ error: "Failed to update navigation state" }),
      {
        status: 500,
      },
    );
  }
};
