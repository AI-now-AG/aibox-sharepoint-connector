import type { APIRoute } from "astro";
import { ObjectId } from "mongodb";
import { z } from "zod";
import slug from "slug";
import GlobalCategoryModel from "$data/models/globalCategory.model";
import type { Category, Group } from "$data/models/globalCategory.model";

const GroupParamSchema = z.object({
  _id: z.string().optional(),
  title: z.string(),
  active: z.boolean().optional(),
  position: z.number().optional(),
});

const CreateCategoryParamsSchema = z.object({
  _id: z.string().optional(),
  title: z.string(),
  groups: z.array(GroupParamSchema),
});

export type CreateCategoryParams = z.infer<typeof CreateCategoryParamsSchema>;
export type GroupParam = z.infer<typeof GroupParamSchema>;

const CategoryParamsSchema = z.object({
  _id: z.string(),
});

export type CategoryParams = z.infer<typeof CategoryParamsSchema>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET: APIRoute = async (ctx) => {
  try {
    const categories = await GlobalCategoryModel.list();
    return new Response(
      JSON.stringify(
        categories.map((category) => ({
          _id: category._id,
          title: category.title,
          groups: category.groups,
        })),
      ),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in GET category method:", error);

    return new Response(
      JSON.stringify({
        message: "Error while fetching categories",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 },
    );
  }
};

export const POST: APIRoute = async (ctx) => {
  const params = await ctx.request.json();
  const data = CreateCategoryParamsSchema.parse(params);

  // Determine the new position
  const maxPositionCategory = await GlobalCategoryModel.getMaxPosition();
  const newPosition = maxPositionCategory
    ? (maxPositionCategory?.position || 0) + 1
    : 1;

  const groups = data.groups.reduce<Group[]>((uniqueGroups, group) => {
    if (!uniqueGroups.some((g) => g.title === group.title)) {
      uniqueGroups.push({
        _id: new ObjectId(),
        title: group.title,
        slug: slug(group.title),
        active: group?.active,
      });
    }
    return uniqueGroups;
  }, []);

  // Create the new category
  const now = new Date();
  const newCategory: Category = {
    ...data,
    title: data.title,
    groups: Array.from(groups),
    slug: slug(data.title),
    tenant_id: tenantId,
    creator_id: ctx.locals.user.id,
    position: newPosition,
    created_at: now,
    updated_at: now,
    icon: z
      .string()
      .parse(
        '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"> <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" color="currentColor"> <path d="M10.55 3c-3.852.007-5.87.102-7.159 1.39C2 5.783 2 8.022 2 12.5s0 6.717 1.391 8.109C4.783 22 7.021 22 11.501 22c4.478 0 6.717 0 8.108-1.391c1.29-1.29 1.384-3.307 1.391-7.16" /> <path d="M11.056 13C10.332 3.866 16.802 1.276 21.98 2.164c.209 3.027-1.273 4.16-4.093 4.684c.545.57 1.507 1.286 1.403 2.18c-.074.638-.506.95-1.372 1.576c-1.896 1.37-4.093 2.234-6.863 2.396" /> <path d="M9 17c2-5.5 3.96-7.364 6-9" /> </g> </svg>',
      ),
  };

  try {
    await GlobalCategoryModel.create(newCategory);
    return new Response(JSON.stringify({ message: "Category added" }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error in POST method:", error);

    return new Response(
      JSON.stringify({
        message: "Add new category failed",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 },
    );
  }
};

export const PUT: APIRoute = async (ctx) => {
  const params = await ctx.request.json();
  const data = CreateCategoryParamsSchema.parse(params);

  const groups = data.groups.reduce<Group[]>((uniqueGroups, group) => {
    if (!uniqueGroups.some((g) => g.title === group.title)) {
      const groupId = ObjectId.isValid(group._id || "")
        ? new ObjectId(group._id)
        : new ObjectId();
      uniqueGroups.push({
        _id: groupId,
        title: group.title,
        slug: slug(group.title),
        active: group?.active,
      });
    }
    return uniqueGroups;
  }, []);

  const category: Category = {
    title: data.title,
    groups: Array.from(groups),
    slug: slug(data.title),
    icon: z
      .string()
      .parse(
        '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"> <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" color="currentColor"> <path d="M10.55 3c-3.852.007-5.87.102-7.159 1.39C2 5.783 2 8.022 2 12.5s0 6.717 1.391 8.109C4.783 22 7.021 22 11.501 22c4.478 0 6.717 0 8.108-1.391c1.29-1.29 1.384-3.307 1.391-7.16" /> <path d="M11.056 13C10.332 3.866 16.802 1.276 21.98 2.164c.209 3.027-1.273 4.16-4.093 4.684c.545.57 1.507 1.286 1.403 2.18c-.074.638-.506.95-1.372 1.576c-1.896 1.37-4.093 2.234-6.863 2.396" /> <path d="M9 17c2-5.5 3.96-7.364 6-9" /> </g> </svg>',
      ),
    updated_at: new Date(),
  };

  try {
    await GlobalCategoryModel.update(data._id!, category);

    return new Response(
      JSON.stringify({
        message: "Category updated",
      }),
      {
        status: 200,
      },
    );
  } catch (error) {
    console.debug(error);

    return new Response(
      JSON.stringify({
        message: "Update new category failed",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 },
    );
  }
};

export const DELETE: APIRoute<CategoryParams> = async (ctx) => {
  try {
    const params = await ctx.request.json();
    const data = CategoryParamsSchema.parse(params);

    if (data._id) {
      const result = await GlobalCategoryModel.remove(data._id.toString());
      return new Response(JSON.stringify(result), { status: 200 });
    }

    return new Response(
      JSON.stringify({ message: "Id error while deleting the category" }),
      { status: 400 },
    );
  } catch (error) {
    console.error("Error in DELETE method:", error);

    return new Response(
      JSON.stringify({
        message: "Error while deleting category",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 },
    );
  }
};
