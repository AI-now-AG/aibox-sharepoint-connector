import { K as KnowledgeBaseModel } from '../../chunks/knowledgeBase.model_DXrPTi6X.mjs';
import { z } from 'zod';
import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { s as stringToObjectId } from '../../chunks/stringToObjectId_BjrW6xXN.mjs';
export { renderers } from '../../renderers.mjs';

const CreateKnowledgeBaseParamsSchema = z.object({
  _id: z.string().optional(),
  title: z.string(),
  knowledge_base: z.string()
});
const KnowledgeBaseParamsSchema = z.object({
  _id: z.string()
});
const model = new ChatOpenAI({
  apiKey: "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",
  model: "gpt-4o"
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
const generateKnowledgeBaseDescription = async (knowledgeBase) => {
  const messages = [
    new SystemMessage(knowledgeBaseInfo),
    new HumanMessage(knowledgeBase)
  ];
  const parser = new StringOutputParser();
  const result = await model.invoke(messages);
  const description = await parser.invoke(result);
  return description;
};
const extractRequiredFields = (knowledgeBases) => {
  return knowledgeBases.map((knowledgeBase) => ({
    _id: knowledgeBase._id,
    title: knowledgeBase.title
  }));
};
const GET = async (ctx) => {
  try {
    const result = await KnowledgeBaseModel.listByUser(ctx.locals.userId);
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
  const data = CreateKnowledgeBaseParamsSchema.parse(params);
  const description = await generateKnowledgeBaseDescription(
    data.knowledge_base
  );
  const knowledgeBase = {
    ...data,
    description,
    tenant_id: stringToObjectId.parse(ctx.locals.tenantId),
    // AI now AG
    creator_id: stringToObjectId.parse(ctx.locals.userId),
    // admin@aibox.ch
    created_at: /* @__PURE__ */ new Date(),
    updated_at: /* @__PURE__ */ new Date()
  };
  try {
    if (knowledgeBase) {
      await KnowledgeBaseModel.add(knowledgeBase);
      return new Response(
        JSON.stringify({
          message: "Knowledgebase added"
        }),
        {
          status: 200
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          message: "Error while adding the Knowledgebase"
        }),
        {
          status: 400
        }
      );
    }
  } catch (error) {
    console.debug(error);
    return new Response(
      JSON.stringify({
        message: "Error while adding the Knowledgebase",
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
  const data = CreateKnowledgeBaseParamsSchema.parse(params);
  const description = await generateKnowledgeBaseDescription(
    data.knowledge_base
  );
  const knowledgeBase = {
    ...data,
    description,
    updated_at: /* @__PURE__ */ new Date()
  };
  try {
    if (knowledgeBase && data._id) {
      await KnowledgeBaseModel.update(data._id, knowledgeBase);
      return new Response(
        JSON.stringify({
          message: "Knowledgebase updated"
        }),
        {
          status: 200
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          message: "Error while updating the Knowledge base"
        }),
        {
          status: 400
        }
      );
    }
  } catch (error) {
    console.debug(error);
    return new Response(
      JSON.stringify({
        message: "Error while updating the Knowledge base",
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
    const data = KnowledgeBaseParamsSchema.parse(params);
    if (data._id) {
      const result = await KnowledgeBaseModel.remove(data._id.toString());
      return new Response(JSON.stringify(result));
    } else {
      return new Response(
        JSON.stringify({
          message: "Id error while deleting the Knowledge base"
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
        message: "Error while deleting Knowledge base",
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
  PUT,
  model
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
