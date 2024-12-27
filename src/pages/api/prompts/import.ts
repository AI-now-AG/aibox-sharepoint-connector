import type { APIContext, APIRoute } from "astro";
import { z } from "zod";
import slug from "slug";
import { ObjectId } from "mongodb";
import { parseString } from "fast-csv";
import type { User } from "lucia";
import PromptModel from "$data/models/prompt.model";
import CategoryModel, { type Category, type Group} from "$data/models/category.model";
import KnowledgeBaseModel from "$data/models/knowledgeBase.model";

const ImportRowItemSchema = z.object({
  _id: z.string().optional(),
  title: z.string(),
  description: z.string(),
  category: z.string().optional(),
  group: z.string().optional(),
  knowledgebase: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ImportRowItem = z.infer<typeof ImportRowItemSchema>;

const syncCategoriesWithGroups = async (rows:ImportRowItem[], user:User) => {
  // Group categories by their name and ensure uniqueness
  const categories = rows.map((item) => {
    return {
      name: item.category,
      group: item.group,
    }
  }).reduce<Record<string, any>>((acc, item) => {
    const key = item['name'] as string;
    if (!acc[key]) {
      acc[key] = [];
    }
    if (!acc[key].includes(item.group)) {
      acc[key].push(item.group);
    }
    return acc;
  }, {});
  console.log('csv categories', categories);

  // Iterate through each category and execute the check & create/update process
  for (const [title, groups] of Object.entries(categories)) {
    const category = await CategoryModel.getByTitleAndTenant(title, user.tenant_id);
    console.log('find category', {
      title, 
      category
    });
    if (!category) {
      const categoryGroups: Group[] = groups.map((group: string) => ({
        _id: new ObjectId(),
        title: group,
        slug: slug(group),
        active: true,
        position: 0,
      }));

      const now = new Date();
      const newCategory: Category = {
        title,
        groups: Array.from(categoryGroups),
        slug: slug(title),
        tenant_id: user.tenant_id,
        creator_id: user.id,
        active: true,
        position: 0,
        created_at: now,
        updated_at: now,
        icon: z
          .string()
          .parse(
            '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"> <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" color="currentColor"> <path d="M10.55 3c-3.852.007-5.87.102-7.159 1.39C2 5.783 2 8.022 2 12.5s0 6.717 1.391 8.109C4.783 22 7.021 22 11.501 22c4.478 0 6.717 0 8.108-1.391c1.29-1.29 1.384-3.307 1.391-7.16" /> <path d="M11.056 13C10.332 3.866 16.802 1.276 21.98 2.164c.209 3.027-1.273 4.16-4.093 4.684c.545.57 1.507 1.286 1.403 2.18c-.074.638-.506.95-1.372 1.576c-1.896 1.37-4.093 2.234-6.863 2.396" /> <path d="M9 17c2-5.5 3.96-7.364 6-9" /> </g> </svg>',
          ),
      };
      await CategoryModel.add(newCategory);
    }
  };
};

export const POST: APIRoute = async (ctx: APIContext) => {
  try {
    const request:Request = ctx.request;

    // Parse the incoming FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), { status: 400 });
    }

    // Read the file content into memory
    const fileContent = await file.text(); // This reads the entire file into a string

    // Parse the CSV content
    const rows: ImportRowItem[] = []; // Array to store the parsed rows
    await new Promise<void>((resolve, reject) => {
      parseString(fileContent, { headers: true }) // Pass the CSV string and options
        .on('data', (row: ImportRowItem) => {
          rows.push(row);
        })
        .on('end', () => resolve())
        .on('error', (error) => reject(error));
    });

    // I. Sync all categories
    await syncCategoriesWithGroups(rows, ctx.locals.user);

    console.log('csv rows', rows);

    // Respond with the parsed rows
    return new Response(JSON.stringify({ data: rows }), { status: 200 });
  } catch (error) {
    console.error("Error fetching data:", error);
    return new Response("Error fetching data", { status: 500 });
  }
};
