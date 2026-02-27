import type { APIRoute } from "astro";
import { z } from "zod";
import GlobalTagModel, { type Tag } from "$data/models/globalTag.model";

const CreateTagParamsSchema = z.object({
  _id: z.string().optional(),
  title: z.string(),
  description: z.string().default(""),
  icon: z.string().nullish(),
  iconColor: z.string().nullish(),
  resellerCodes: z.array(z.string()).default([]),
});

export type CreateTagParams = z.infer<typeof CreateTagParamsSchema>;

const TagParamsSchema = z.object({
  _id: z.string(),
});

export type TagParams = z.infer<typeof TagParamsSchema>;

export const GET: APIRoute = async () => {
  try {
    const tags = await GlobalTagModel.list();
    return new Response(
      JSON.stringify(
        tags.map((tag) => ({
          _id: tag._id,
          title: tag.title,
          description: tag.description,
          icon: tag.icon,
          iconColor: tag.iconColor,
          resellerCodes: tag.resellerCodes,
        })),
      ),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in GET tags method:", error);
    return new Response(
      JSON.stringify({
        message: "Error while fetching tags",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 },
    );
  }
};

export const POST: APIRoute = async (ctx) => {
  const params = await ctx.request.json();
  const data = CreateTagParamsSchema.parse(params);

  // Create the new tag
  const newTag: Partial<Tag> = {
    title: data.title,
    resellerCodes: [],
  };

  try {
    await GlobalTagModel.create(newTag);
    return new Response(JSON.stringify({ message: "Tag added" }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error in POST method:", error);

    return new Response(
      JSON.stringify({
        message: "Add new tag failed",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 },
    );
  }
};

export const PUT: APIRoute = async (ctx) => {
  const params = await ctx.request.json();
  const data = CreateTagParamsSchema.parse(params);

  const tag: Partial<Tag> = {
    title: data.title,
    description: data.description,
    icon: data.icon,
    iconColor: data.iconColor,
    resellerCodes: data.resellerCodes,
  };

  try {
    await GlobalTagModel.update(data._id!, tag);

    return new Response(
      JSON.stringify({
        message: "Tag updated",
      }),
      {
        status: 200,
      },
    );
  } catch (error) {
    console.debug(error);

    return new Response(
      JSON.stringify({
        message: "Update new tag failed",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 },
    );
  }
};

export const DELETE: APIRoute<TagParams> = async (ctx) => {
  try {
    const params = await ctx.request.json();
    const data = TagParamsSchema.parse(params);

    if (data._id) {
      const result = await GlobalTagModel.remove(data._id.toString());
      return new Response(JSON.stringify(result), { status: 200 });
    }

    return new Response(
      JSON.stringify({ message: "Id error while deleting the tag" }),
      { status: 400 },
    );
  } catch (error) {
    console.error("Error in DELETE method:", error);

    return new Response(
      JSON.stringify({
        message: "Error while deleting tag",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 },
    );
  }
};
