import { ObjectId } from 'mongodb';
import { z } from 'zod';
import slug from 'slug';
import { s as stringToObjectId } from '../../chunks/stringToObjectId_BjrW6xXN.mjs';
import { C as CategoryModel } from '../../chunks/category.model_BGsEiyL0.mjs';
export { renderers } from '../../renderers.mjs';

const CreateCategoryParamsSchema = z.object({
  _id: z.string().optional(),
  title: z.string(),
  groups: z.array(
    z.object({
      _id: z.string().optional(),
      title: z.string()
    })
  )
});
const CategoryParamsSchema = z.object({
  _id: z.string()
});
const extractRequiredFields = (categories) => {
  return categories.map((category) => ({
    _id: category._id,
    title: category.title,
    groups: category.groups
  }));
};
const GET = async (ctx) => {
  try {
    const result = await CategoryModel.listByUser(ctx.locals.userId);
    const data = extractRequiredFields(await result.toArray());
    return new Response(JSON.stringify(data));
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        message: "Error while fetching categories",
        error
      }),
      {
        status: 500
      }
    );
  }
};
const POST = async (ctx) => {
  const params = await ctx.request.json();
  const data = CreateCategoryParamsSchema.parse(params);
  const groups = new Set(
    data.groups.map((group) => ({
      _id: new ObjectId(),
      title: group.title,
      slug: slug(group.title)
    }))
  );
  const newCategory = {
    ...data,
    title: data.title,
    groups: Array.from(groups),
    slug: slug(data.title),
    tenant_id: stringToObjectId.parse(ctx.locals.tenantId),
    // AI now AG
    creator_id: stringToObjectId.parse(ctx.locals.userId),
    // admin@aibox.ch
    created_at: /* @__PURE__ */ new Date(),
    updated_at: /* @__PURE__ */ new Date(),
    icon: z.string().parse(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"> <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" color="currentColor"> <path d="M10.55 3c-3.852.007-5.87.102-7.159 1.39C2 5.783 2 8.022 2 12.5s0 6.717 1.391 8.109C4.783 22 7.021 22 11.501 22c4.478 0 6.717 0 8.108-1.391c1.29-1.29 1.384-3.307 1.391-7.16" /> <path d="M11.056 13C10.332 3.866 16.802 1.276 21.98 2.164c.209 3.027-1.273 4.16-4.093 4.684c.545.57 1.507 1.286 1.403 2.18c-.074.638-.506.95-1.372 1.576c-1.896 1.37-4.093 2.234-6.863 2.396" /> <path d="M9 17c2-5.5 3.96-7.364 6-9" /> </g> </svg>'
    )
  };
  try {
    await CategoryModel.upsert(newCategory);
    return new Response(
      JSON.stringify({
        message: "Category added"
      }),
      {
        status: 200
      }
    );
  } catch (error) {
    console.debug(error);
    return new Response(
      JSON.stringify({
        message: "Add new category failed....",
        error
      }),
      {
        status: 500
      }
    );
  }
};
const PUT = async (ctx) => {
  const params = await ctx.request.json();
  const data = CreateCategoryParamsSchema.parse(params);
  const groups = new Set(
    data.groups.map((group) => ({
      _id: group._id ? stringToObjectId.parse(group._id) : new ObjectId(),
      title: group.title,
      slug: slug(group.title)
    }))
  );
  const newCategory = {
    ...data,
    title: data.title,
    groups: Array.from(groups),
    slug: slug(data.title),
    icon: z.string().parse(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"> <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" color="currentColor"> <path d="M10.55 3c-3.852.007-5.87.102-7.159 1.39C2 5.783 2 8.022 2 12.5s0 6.717 1.391 8.109C4.783 22 7.021 22 11.501 22c4.478 0 6.717 0 8.108-1.391c1.29-1.29 1.384-3.307 1.391-7.16" /> <path d="M11.056 13C10.332 3.866 16.802 1.276 21.98 2.164c.209 3.027-1.273 4.16-4.093 4.684c.545.57 1.507 1.286 1.403 2.18c-.074.638-.506.95-1.372 1.576c-1.896 1.37-4.093 2.234-6.863 2.396" /> <path d="M9 17c2-5.5 3.96-7.364 6-9" /> </g> </svg>'
    ),
    updated_at: /* @__PURE__ */ new Date()
  };
  try {
    await CategoryModel.update(data._id, newCategory);
    return new Response(
      JSON.stringify({
        message: "Category updated"
      }),
      {
        status: 200
      }
    );
  } catch (error) {
    console.debug(error);
    return new Response(
      JSON.stringify({
        message: "Update new category failed....",
        error
      }),
      {
        status: 500
      }
    );
  }
};
const DELETE = async (ctx) => {
  try {
    const params = await ctx.request.json();
    const data = CategoryParamsSchema.parse(params);
    if (data._id) {
      const result = await CategoryModel.remove(data._id.toString());
      return new Response(JSON.stringify(result));
    } else {
      return new Response(
        JSON.stringify({
          message: "Id error while deleting the category"
        }),
        {
          status: 400
        }
      );
    }
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        message: "Error while deleting category",
        error
      }),
      {
        status: 500
      }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  DELETE,
  GET,
  POST,
  PUT
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
