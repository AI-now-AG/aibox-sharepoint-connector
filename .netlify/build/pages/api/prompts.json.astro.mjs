import { P as PromptModel } from '../../chunks/prompt.model_CneM5GzG.mjs';
import { z } from 'zod';
import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { s as stringToObjectId } from '../../chunks/stringToObjectId_BjrW6xXN.mjs';
import { I as InstructionModel } from '../../chunks/instruction.model_BxQBp-yu.mjs';
import { K as KnowledgeBaseModel } from '../../chunks/knowledgeBase.model_DXrPTi6X.mjs';
export { renderers } from '../../renderers.mjs';

const CreatePromptParamsSchema = z.object({
  _id: z.string().optional(),
  title: z.string(),
  category: z.string(),
  group: z.string(),
  instructions: z.array(z.string().optional()),
  knowledgebase: z.array(z.string().optional()),
  prompt: z.string(),
  documents: z.array(z.string()).optional()
});
const model = new ChatOpenAI({
  apiKey: "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",
  model: "gpt-4o"
});
const PromptParamsSchema = z.object({
  _id: z.string()
});
const instructions = `You are a helpful assistant who writes helpful descriptions of prompts for a UI:
* You receive a prompt
* You create a friendly description of the prompt, describing what it does and what it is about
* Use at most 2 sentences
* Return just the description, without any formatting or the prompt
* The description must be german and target a swiss audience
* Use a friendly and personal tone
* Only describe what the prompt does, do not add a call to action

Example:
Input: Erstelle eine Titel für einen Schweizer Presseartikel im Stil von "Knowledge Base Somedia-Schlagzeilen" und "Instructions Headline" auf Basis der folgenden Texteingabe. Stelle sicher, dass die Schlagzeilen dem Stil und den Erwartungen der Schweizer Presseartikel und sowie der vorhandenen Knowledge Base entsprechen. Befolge die angegebenen spezifischen Instruktionen.

Output: Hier kannst du einen prägnanten Titel für einen Schweizer Presseartikel erstellen, der den spezifischen Anforderungen und dem gewünschten Stil entspricht. Die Überschrift wird an die Erwartungen der Schweizer Medien angepasst und berücksichtigt die vorhandene Knowledge Base.`;
const generatePromptDescription = async (prompt) => {
  const messages = [new SystemMessage(instructions), new HumanMessage(prompt)];
  const parser = new StringOutputParser();
  const result = await model.invoke(messages);
  const description = await parser.invoke(result);
  return description;
};
const POST = async (ctx) => {
  const params = await ctx.request.json();
  const data = CreatePromptParamsSchema.parse(params);
  const description = await generatePromptDescription(data.prompt);
  const prompt = {
    ...data,
    category: stringToObjectId.parse(data.category),
    group: stringToObjectId.parse(data.group),
    instructions: data.instructions?.map(
      (inst) => stringToObjectId.parse(inst)
    ),
    knowledgebase: data.knowledgebase?.map(
      (inst) => stringToObjectId.parse(inst)
    ),
    documents: data.documents?.map((doc) => stringToObjectId.parse(doc)),
    description,
    tenant_id: stringToObjectId.parse(ctx.locals.tenantId),
    // AI now AG
    creator_id: stringToObjectId.parse(ctx.locals.userId),
    // admin@aibox.ch
    //tenant_id: stringToObjectId.parse("66aa2169d40d0b194e280142"), // AI now AG
    //creator_id: stringToObjectId.parse("669e044a6e55bbb8fe31a868"), // admin@aibox.ch
    created_at: /* @__PURE__ */ new Date(),
    updated_at: /* @__PURE__ */ new Date()
  };
  try {
    if (prompt) {
      await PromptModel.add(prompt);
      return new Response(
        JSON.stringify({
          message: "Prompt added"
        }),
        {
          status: 200
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          message: "Error while adding the prompt"
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
        message: "Error while adding the prompt",
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
  const data = CreatePromptParamsSchema.parse(params);
  const description = await generatePromptDescription(data.prompt);
  const prompt = {
    ...data,
    category: stringToObjectId.parse(data.category),
    group: stringToObjectId.parse(data.group),
    instructions: data.instructions?.map(
      (inst) => stringToObjectId.parse(inst)
    ),
    knowledgebase: data.knowledgebase?.map(
      (inst) => stringToObjectId.parse(inst)
    ),
    documents: data.documents?.map((doc) => stringToObjectId.parse(doc)),
    description,
    updated_at: /* @__PURE__ */ new Date()
  };
  try {
    if (prompt && data._id) {
      await PromptModel.update(data._id, prompt);
      return new Response(
        JSON.stringify({
          message: "Prompt updated"
        }),
        {
          status: 200
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          message: "Error while updating the prompt"
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
        message: "Error while updating the prompt",
        error
      }),
      {
        status: 500
      }
    );
  }
};
const extractRequiredFields = (prompt, instructions2, knowledgebase) => ({
  title: prompt.title,
  prompt: prompt.prompt,
  instructions: instructions2.map((inst) => ({
    title: inst.title,
    instruction: inst.instruction
  })),
  knowledgebase: knowledgebase.map((kb) => ({
    title: kb.title,
    knowledge_base: kb.knowledge_base
  }))
});
const GET = async (ctx) => {
  try {
    const promptId = ctx.url.searchParams.get("_id");
    if (promptId) {
      const prompt = await PromptModel.get(promptId);
      if (!prompt) {
        return new Response(
          JSON.stringify({
            message: "prompt not found"
          }),
          {
            status: 400
          }
        );
      }
      let instructions2 = [];
      if (prompt?.instructions) {
        const calls = prompt.instructions.map(async (inst) => {
          const instruction = await InstructionModel.get(inst.toString());
          return instruction;
        });
        instructions2 = await Promise.all(calls);
      }
      let knowledgebases = [];
      if (prompt?.knowledgebase) {
        const calls = prompt.knowledgebase.map(async (kb) => {
          const instruction = await KnowledgeBaseModel.get(kb.toString());
          return instruction;
        });
        knowledgebases = await Promise.all(calls);
      }
      const promptData = extractRequiredFields(
        prompt,
        instructions2,
        knowledgebases
      );
      return new Response(JSON.stringify(promptData));
    } else {
      return new Response(
        JSON.stringify({
          message: "Id error while fetching the prompt"
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
        message: "Error while fetching prompt",
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
    const data = PromptParamsSchema.parse(params);
    if (data._id) {
      const result = await PromptModel.remove(data._id.toString());
      return new Response(JSON.stringify(result));
    } else {
      return new Response(
        JSON.stringify({
          message: "Id error while deleting the prompt"
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
        message: "Error while deleting prompt",
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
