import type { APIContext, APIRoute } from "astro";
import { z } from "zod";
import slug from "slug";
import { ObjectId } from "mongodb";
import { parseString } from "fast-csv";
import type { User } from "lucia";
import { client } from "$data/mongodb";
import PromptModel, { type Prompt } from "$data/models/prompt.model";
import CategoryModel, {
  type Category,
  type Group,
} from "$data/models/category.model";
import KnowledgeBaseModel, {
  type KnowledgeBase,
} from "$data/models/knowledgeBase.model";
import type { CsvRowRaw, CsvRowParsed } from "$types/prompt-csv.types";

type KnowledgeBaseRawItem = {
  title: string;
  description: string;
  knowledge_base: string;
} & Record<string, any>;

const parseCsvData = (rows: CsvRowRaw[]) => {
  const parsedRows: CsvRowParsed[] = rows.map((item: CsvRowRaw) => {
    const text = item.knowledgebase || "";
    // Split sections by [break]
    const sections = text
      .split("[break]")
      .map((section) => section.trim())
      .filter(Boolean);

    // Parse each section into an object
    const result = sections.map((section) => {
      const obj: KnowledgeBaseRawItem = {
        title: "",
        description: "",
        knowledge_base: "",
      };

      // Extract each line (";") and parse key-value pairs
      const lines = section.split(";").filter((line) => line.trim());
      lines.forEach((line) => {
        const match = line.replace(/\s/g, "").match(/^\[(.+?)\]:\s*(.+)$/); // Match [key]: value;
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          obj[key] = value;
        }
      });

      return obj;
    });

    return { ...item, ...{ knowledgebase: result } };
  });

  return parsedRows;
};

const syncCategoriesWithGroups = async (rows: CsvRowParsed[], user: User) => {
  // Group categories by their name and ensure uniqueness
  const categories = rows
    .map((item: CsvRowParsed) => {
      return {
        name: item.category,
        group: item.group,
      };
    })
    .reduce<Record<string, any>>((acc, item) => {
      const key = item["name"] as string;
      if (!acc[key]) {
        acc[key] = [];
      }
      if (!acc[key].includes(item.group)) {
        acc[key].push(item.group);
      }
      return acc;
    }, {});

  // Iterate through each category and execute the check & create/update process
  for (const [title, groups] of Object.entries(categories)) {
    const category = await CategoryModel.getByTitleAndTenant(
      title,
      user.tenant_id,
    );
    if (category) {
      const existingGroups = category.groups.map((group: Group) => group.title);
      const diffGroups = groups.filter(
        (group: string) => !existingGroups.includes(group),
      );
      const newGroups: Group[] = diffGroups.map((group: string) => ({
        _id: new ObjectId(),
        title: group,
        slug: slug(group),
        active: true,
        position: 0,
      }));

      const update = {
        groups: [...category.groups, ...newGroups],
      };
      await CategoryModel.update(category._id.toString(), update);
    } else {
      const newGroups: Group[] = groups.map((group: string) => ({
        _id: new ObjectId(),
        title: group,
        slug: slug(group),
        active: true,
        position: 0,
      }));

      const newCategory: Category = {
        title,
        groups: Array.from(newGroups),
        slug: slug(title),
        tenant_id: user.tenant_id,
        creator_id: user.id,
        active: true,
        position: 0,
        created_at: new Date(),
        updated_at: new Date(),
        icon: z
          .string()
          .parse(
            '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"> <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" color="currentColor"> <path d="M10.55 3c-3.852.007-5.87.102-7.159 1.39C2 5.783 2 8.022 2 12.5s0 6.717 1.391 8.109C4.783 22 7.021 22 11.501 22c4.478 0 6.717 0 8.108-1.391c1.29-1.29 1.384-3.307 1.391-7.16" /> <path d="M11.056 13C10.332 3.866 16.802 1.276 21.98 2.164c.209 3.027-1.273 4.16-4.093 4.684c.545.57 1.507 1.286 1.403 2.18c-.074.638-.506.95-1.372 1.576c-1.896 1.37-4.093 2.234-6.863 2.396" /> <path d="M9 17c2-5.5 3.96-7.364 6-9" /> </g> </svg>',
          ),
      };
      await CategoryModel.add(newCategory);
    }
  }
};

const syncKnowledgeBases = async (rows: CsvRowParsed[], user: User) => {
  // Flatten and remove duplicates by title
  const knowledgebases = rows.map((item: CsvRowParsed) => item.knowledgebase);
  const uniqueKnowledgeBases = knowledgebases
    .flat()
    .reduce<KnowledgeBaseRawItem[]>((acc, item) => {
      if (!acc.some((kb) => kb.title === item.title)) {
        acc.push(item);
      }
      return acc;
    }, []);

  // Iterate through each category and execute the check & create/update process
  for (const kb of uniqueKnowledgeBases) {
    const knowledgebase = await KnowledgeBaseModel.getByTitleAndTenant(
      kb.title,
      user.tenant_id,
    );
    if (!knowledgebase) {
      const newKnowledgeBase: KnowledgeBase = {
        title: kb.title,
        knowledge_base: kb.knowledge_base,
        description: kb.description,
        tenant_id: user.tenant_id,
        creator_id: user.id,
        created_at: new Date(),
        updated_at: new Date(),
      };
      await KnowledgeBaseModel.add(newKnowledgeBase);
    }
  }
};

const syncPrompts = async (rows: CsvRowParsed[], user: User) => {
  const categoriesCursor = await CategoryModel.listByTenant(user.tenant_id);
  const categories = await categoriesCursor.toArray();

  for (const item of rows) {
    const prompt = await PromptModel.getByTitleAndTenant(
      item.title,
      user.tenant_id,
    );
    if (!prompt) {
      // Get the _id of the category that matches item.category, or undefined if not found.
      const findCategory = categories.find(
        (category) => category.title?.trim() == item.category?.trim(),
      );
      const promptCategory = findCategory ? findCategory._id : undefined;

      // Get the _id of the group that matches findCategory.groups, or undefined if not found.
      const findGroup = findCategory?.groups?.find(
        (group) => group.title?.trim() == item.group?.trim(),
      );
      const promptGroup = findGroup ? findGroup._id : undefined;

      // Collect prompt knowledgebases
      const promptKbs: ObjectId[] = [];
      for (const kb of item.knowledgebase) {
        const knowledgebase = await KnowledgeBaseModel.getByTitleAndTenant(
          kb.title,
          user.tenant_id,
        );
        if (knowledgebase) {
          promptKbs.push(knowledgebase._id);
        }
      }

      const newPrompt: Prompt = {
        title: item.title,
        description: item.description,
        category: promptCategory,
        group: promptGroup,
        knowledgebase: promptKbs,
        position: 0,
        tenant_id: user.tenant_id,
        creator_id: user.id,
        created_at: new Date(),
        updated_at: new Date(),
        prompt: item.prompt,
      };
      await PromptModel.add(newPrompt);
    }
  }
};

export const POST: APIRoute = async (ctx: APIContext) => {
  try {
    const request: Request = ctx.request;

    // Parse the incoming FormData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), {
        status: 400,
      });
    }

    // Read the file content into memory
    const fileContent = await file.text(); // This reads the entire file into a string

    // Parse the CSV content
    const rows: CsvRowRaw[] = []; // Array to store the parsed rows
    await new Promise<void>((resolve, reject) => {
      parseString(fileContent, { headers: true }) // Pass the CSV string and options
        .on("data", (row: CsvRowRaw) => {
          rows.push(row);
        })
        .on("end", () => resolve())
        .on("error", (error) => reject(error));
    });

    const session = client.startSession();

    try {
      // Start a transaction
      session.startTransaction();

      // Parse all row data
      const parsedRows = parseCsvData(rows);

      // Sync all categories
      await syncCategoriesWithGroups(parsedRows, ctx.locals.user);

      // Sync all knowledgeBase
      await syncKnowledgeBases(parsedRows, ctx.locals.user);

      // Sync all prompts
      await syncPrompts(parsedRows, ctx.locals.user);

      // If everything goes well, commit the transaction
      await session.commitTransaction();
      console.log("Transaction committed");
    } catch (error) {
      // If an error occurs, abort the transaction and log the error
      await session.abortTransaction();
      console.error("Transaction aborted due to an error:", error);

      return new Response(
        JSON.stringify({
          message: "Transaction aborted due to an error.",
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        { status: 500 },
      );
    } finally {
      // End the session after the transaction
      session.endSession();
    }

    // Respond with the parsed rows
    return new Response(JSON.stringify({ data: rows }), { status: 200 });
  } catch (error) {
    console.error("Error import data:", error);
    return new Response("Error import data", { status: 500 });
  }
};
