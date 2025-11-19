import type { APIContext, APIRoute } from "astro";
import KnowledgeBaseModel, {
  type KnowledgeBase,
} from "$data/models/knowledgeBase.model";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import createChatModel from "$utils/chatModel";
import {
  KnowledgeBaseParamsSchema,
  CreateKnowledgeBaseParamsSchema,
  type CreateKnowledgeBaseParams,
  type KnowledgeBaseParams,
} from "$types/KnowledgeBaseAPI";

const knowledgeBaseInfo = `Write me a short summary that will be shown in the UI to describe the provided knowledge base. The output should contain not more than 100 characters. Also it should be created in the language provided in the knowledge base. If it’s unclear, always provide a German summary.`;

const generateKnowledgeBaseDescription = async (
  ctx: APIContext,
  knowledgeBase: string,
) => {
  const model = createChatModel(ctx);

  const messages = [
    new SystemMessage(knowledgeBaseInfo),
    new HumanMessage(knowledgeBase),
  ];
  const parser = new StringOutputParser();
  const result = await model.invoke(messages);
  const description = await parser.invoke(result);

  return description;
};

export const GET: APIRoute = async (ctx: APIContext) => {
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
    ctx,
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
    modified_by: ctx.locals.user.email,
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
    ctx,
    data.knowledge_base,
  );
  const knowledgeBase: KnowledgeBase = {
    title: data.title,
    knowledge_base: data.knowledge_base,
    description,
    updated_at: new Date(),
    modified_by: ctx.locals.user.email,
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
