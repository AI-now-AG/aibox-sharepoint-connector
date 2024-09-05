import type { APIRoute } from "astro";
import KnowledgeBaseModel, {
  type KnowledgeBase,
} from "$data/models/knowledgeBase.model";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";

const CreateKnowledgeBaseParamsSchema = z.object({
  _id: z.string().optional(),
  title: z.string(),
  knowledge_base: z.string(),
});

export type CreateKnowledgeBaseParams = z.infer<
  typeof CreateKnowledgeBaseParamsSchema
>;

const KnowledgeBaseParamsSchema = z.object({
  _id: z.string(),
});

export type KnowledgeBaseParams = z.infer<typeof KnowledgeBaseParamsSchema>;

export const model = new ChatOpenAI({
  apiKey: import.meta.env.OPENAI_API_KEY,
  model: import.meta.env.OPENAI_MODEL,
});

const knowledgeBaseInfo = `You are a helpful assistant who writes helpful descriptions of knowledge base for a UI:
* You receive a knowledge base
* You create a friendly description of the knowledge base, describing what it does and what it is about
* Use at most 2 sentences
* Return just the description, without any formatting or the knowledge base
* The description must be german and target a swiss audience
* Use a friendly and personal tone
* Only describe what the knowledge base does, do not add a call to action

Example:
Input: Erstelle eine Titel für einen Schweizer Presseartikel im Stil von "Knowledge Base Somedia-Schlagzeilen" und "knowledge base Headline" auf Basis der folgenden Texteingabe. Stelle sicher, dass die Schlagzeilen dem Stil und den Erwartungen der Schweizer Presseartikel und sowie der vorhandenen Knowledge Base entsprechen. Befolge die angegebenen spezifischen Instruktionen.

Output: Hier kannst du einen prägnanten Titel für einen Schweizer Presseartikel erstellen, der den spezifischen Anforderungen und dem gewünschten Stil entspricht. Die Überschrift wird an die Erwartungen der Schweizer Medien angepasst und berücksichtigt die vorhandene Knowledge Base.`;

const generateKnowledgeBaseDescription = async (knowledgeBase: string) => {
  const messages = [
    new SystemMessage(knowledgeBaseInfo),
    new HumanMessage(knowledgeBase),
  ];
  const parser = new StringOutputParser();
  const result = await model.invoke(messages);
  const description = await parser.invoke(result);

  return description;
};

export const GET: APIRoute = async (ctx) => {
  try {
    const result = await KnowledgeBaseModel.listByTenant(
      ctx.locals.user.tenant_id,
    );
    const documents = await result.toArray();
    return new Response(
      JSON.stringify(
        documents.map((doc) => ({
          _id: doc._id,
          title: doc.title,
        })),
      ),
    );
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

export const POST: APIRoute<CreateKnowledgeBaseParams> = async (ctx) => {
  const params = await ctx.request.json();
  const data = CreateKnowledgeBaseParamsSchema.parse(params);

  // We generate a description based on the KnowledgeBase
  const description = await generateKnowledgeBaseDescription(
    data.knowledge_base,
  );
  // TODO: Here we would add user informations like the tenant and the user id. We don't have that
  // feature to get these just based on the token for now. Wait until the Auth0 task is done. Until
  // then we use fixed values.
  const knowledgeBase: KnowledgeBase = {
    title: data.title,
    knowledge_base: data.knowledge_base,
    description,
    tenant_id: ctx.locals.user.tenant_id,
    creator_id: ctx.locals.user.id,
    created_at: new Date(),
    updated_at: new Date(),
  };
  try {
    if (knowledgeBase) {
      await KnowledgeBaseModel.add(knowledgeBase);

      return new Response(
        JSON.stringify({
          message: "Knowledgebase added",
        }),
        {
          status: 200,
        },
      );
    } else {
      return new Response(
        JSON.stringify({
          message: "Error while adding the Knowledgebase",
        }),
        {
          status: 400,
        },
      );
    }
  } catch (error) {
    console.debug(error);

    return new Response(
      JSON.stringify({
        message: "Error while adding the Knowledgebase",
        error: error,
      }),
      {
        status: 500,
      },
    );
  }
};

export const PUT: APIRoute<CreateKnowledgeBaseParams> = async (ctx) => {
  const params = await ctx.request.json();
  const data = CreateKnowledgeBaseParamsSchema.parse(params);

  // We generate a description based on the KnowledgeBase
  const description = await generateKnowledgeBaseDescription(
    data.knowledge_base,
  );
  const knowledgeBase: KnowledgeBase = {
    title: data.title,
    knowledge_base: data.knowledge_base,
    description,
    updated_at: new Date(),
  };
  try {
    if (knowledgeBase && data._id) {
      await KnowledgeBaseModel.update(data._id, knowledgeBase);

      return new Response(
        JSON.stringify({
          message: "Knowledgebase updated",
        }),
        {
          status: 200,
        },
      );
    } else {
      return new Response(
        JSON.stringify({
          message: "Error while updating the Knowledge base",
        }),
        {
          status: 400,
        },
      );
    }
  } catch (error) {
    console.debug(error);

    return new Response(
      JSON.stringify({
        message: "Error while updating the Knowledge base",
        error: error,
      }),
      {
        status: 500,
      },
    );
  }
};

export const DELETE: APIRoute<KnowledgeBaseParams> = async (ctx) => {
  try {
    const params = await ctx.request.json();
    const data = KnowledgeBaseParamsSchema.parse(params);

    if (data._id) {
      const result = await KnowledgeBaseModel.remove(data._id.toString());
      return new Response(JSON.stringify(result));
    } else {
      return new Response(
        JSON.stringify({
          message: "Id error while deleting the Knowledge base",
        }),
        {
          status: 400,
        },
      );
    }
  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({
        message: "Error while deleting Knowledge base",
        error: error,
      }),
      {
        status: 500,
      },
    );
  }
};
