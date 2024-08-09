import type { APIRoute } from "astro";
import KnowledgeBaseModel, {
  type KnowledgeBase,
} from "$data/models/knowledgeBase.model";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { stringToObjectId } from "$utils/stringToObjectId";

const CreateKnowledgeBaseParamsSchema = z.object({
  title: z.string(),
  knowledge_base: z.string(),
});

export type CreateKnowledgeBaseParams = z.infer<
  typeof CreateKnowledgeBaseParamsSchema
>;

export const model = new ChatOpenAI({
  apiKey: import.meta.env.OPENAI_API_KEY,
  model: "gpt-4o-mini",
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

const extractRequiredFields = (knowledgeBases: any) => {
  return knowledgeBases.map((knowledgeBase: any) => ({
    _id: knowledgeBase._id,
    title: knowledgeBase.title,
  }));
};

export const GET: APIRoute = async (ctx) => {
  try {
    const result = await KnowledgeBaseModel.listByUser(ctx.locals.userId);
    const data = extractRequiredFields(await result.toArray());
    return new Response(JSON.stringify(data));
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
  console.log("----");
  console.log(data);
  console.log("----");
  // TODO: Here we would add user informations like the tenant and the user id. We don't have that
  // feature to get these just based on the token for now. Wait until the Auth0 task is done. Until
  // then we use fixed values.
  const knowledgeBase: KnowledgeBase = {
    ...data,
    description,
    tenant_id: stringToObjectId.parse(ctx.locals.tenantId), // AI now AG
    creator_id: stringToObjectId.parse(ctx.locals.userId), // admin@aibox.ch
    created_at: new Date(),
    updated_at: new Date(),
  };
  console.log("---1-");
  console.log(knowledgeBase);
  console.log("---2-");
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
