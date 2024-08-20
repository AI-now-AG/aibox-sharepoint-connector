import { I as InstructionModel } from '../../chunks/instruction.model_BxQBp-yu.mjs';
import { z } from 'zod';
import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { s as stringToObjectId } from '../../chunks/stringToObjectId_BjrW6xXN.mjs';
export { renderers } from '../../renderers.mjs';

const CreateInstructionParamsSchema = z.object({
  _id: z.string().optional(),
  title: z.string(),
  instruction: z.string()
});
const InstructionParamsSchema = z.object({
  _id: z.string()
});
const model = new ChatOpenAI({
  apiKey: "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",
  model: "gpt-4o"
});
const instructions = `You are a helpful assistant who writes helpful descriptions of instuctions for a UI:
* You receive a instruction
* You create a friendly description of the instruction, describing what it does and what it is about
* Use at most 2 sentences
* Return just the description, without any formatting or the instruction
* The description must be german and target a swiss audience
* Use a friendly and personal tone
* Only describe what the instruction does, do not add a call to action

Example:
Input: Erstelle eine Titel für einen Schweizer Presseartikel im Stil von "Knowledge Base Somedia-Schlagzeilen" und "Instructions Headline" auf Basis der folgenden Texteingabe. Stelle sicher, dass die Schlagzeilen dem Stil und den Erwartungen der Schweizer Presseartikel und sowie der vorhandenen Knowledge Base entsprechen. Befolge die angegebenen spezifischen Instruktionen.

Output: Hier kannst du einen prägnanten Titel für einen Schweizer Presseartikel erstellen, der den spezifischen Anforderungen und dem gewünschten Stil entspricht. Die Überschrift wird an die Erwartungen der Schweizer Medien angepasst und berücksichtigt die vorhandene Knowledge Base.`;
const generateInstructionDescription = async (instruction) => {
  const messages = [
    new SystemMessage(instructions),
    new HumanMessage(instruction)
  ];
  const parser = new StringOutputParser();
  const result = await model.invoke(messages);
  const description = await parser.invoke(result);
  return description;
};
const extractRequiredFields = (instuctions) => {
  return instuctions.map((instruction) => ({
    _id: instruction._id,
    title: instruction.title
  }));
};
const GET = async (ctx) => {
  try {
    const result = await InstructionModel.listByUser(ctx.locals.userId);
    const data = extractRequiredFields(await result.toArray());
    return new Response(JSON.stringify(data));
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        message: "Error while fetching instuctions",
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
  const data = CreateInstructionParamsSchema.parse(params);
  const description = await generateInstructionDescription(data.instruction);
  const instruction = {
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
    if (instruction) {
      await InstructionModel.add(instruction);
      return new Response(
        JSON.stringify({
          message: "Intruction added"
        }),
        {
          status: 200
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          message: "Error while adding the intruction"
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
        message: "Error while adding the intruction",
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
  const data = CreateInstructionParamsSchema.parse(params);
  const description = await generateInstructionDescription(data.instruction);
  const instruction = {
    ...data,
    description,
    updated_at: /* @__PURE__ */ new Date()
  };
  try {
    if (instruction && data._id) {
      await InstructionModel.update(data._id, instruction);
      return new Response(
        JSON.stringify({
          message: "Intruction updated"
        }),
        {
          status: 200
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          message: "Error while updating the intruction"
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
        message: "Error while updating the intruction",
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
    const data = InstructionParamsSchema.parse(params);
    if (data._id) {
      const result = await InstructionModel.remove(data._id.toString());
      return new Response(JSON.stringify(result));
    } else {
      return new Response(
        JSON.stringify({
          message: "Id error while deleting the instruction"
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
        message: "Error while deleting instruction",
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
