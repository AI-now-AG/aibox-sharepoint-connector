import type { APIRoute } from "astro";
import { ObjectId } from "mongodb";
import { z } from "zod";
import slug from "slug";
import { stringToObjectId } from "$utils/stringToObjectId";
import CategoryModel from "$data/models/category.model";
import type { Category, Group } from "$data/models/category.model";

const CreateCategoryParamsSchema = z.object({
  title: z.string(),
  groups: z.array(z.string()),
});

export type CreateCategoryParams = z.infer<typeof CreateCategoryParamsSchema>;

export const GET: APIRoute = async () => {
  try {
    const result = await CategoryModel.list();

    return new Response(JSON.stringify(await result.toArray()));
  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({
        message: "Error while fetching categories",
        error: error,
      }),
      {
        status: 500,
      },
    );
  }
};

export const POST: APIRoute = async (ctx) => {
  const params = await ctx.request.json();
  const data = CreateCategoryParamsSchema.parse(params);

  let groups = new Set<Group>(
    data.groups.map((title) => ({
      _id: new ObjectId(),
      title,
      slug: slug(title),
    })),
  );
  const existingCategory = await CategoryModel.get(data.title);
  if (existingCategory && existingCategory.groups?.length > 0) {
    groups = new Set([...existingCategory.groups, ...groups]);
  }

  const newCategory: Category = existingCategory
    ? {
        ...existingCategory,
        groups: Array.from(groups),
      }
    : {
        ...data,
        title: data.title,
        groups: Array.from(groups),
        slug: slug(data.title),
        tenant_id: stringToObjectId.parse("66aa2169d40d0b194e280142"), // AI now AG
        creator_id: stringToObjectId.parse("669e044a6e55bbb8fe31a868"), // admin@aibox.ch
        created_at: new Date(),
        updated_at: new Date(),
      };

  try {
    await CategoryModel.upsert(newCategory);

    return new Response(
      JSON.stringify({
        message: "Category added",
      }),
      {
        status: 200,
      },
    );
  } catch (error) {
    console.debug(error);

    return new Response(
      JSON.stringify({
        message: "Add new category failed....",
        error: error,
      }),
      {
        status: 500,
      },
    );
  }
};
