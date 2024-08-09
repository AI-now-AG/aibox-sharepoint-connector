import type { APIRoute } from "astro";
import InstructionModel, {
  type Instruction,
} from "$data/models/instruction.model";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { stringToObjectId } from "$utils/stringToObjectId";

const CreateInstructionParamsSchema = z.object({
  title: z.string(),
  instruction: z.string(),
});

export type CreateInstructionParams = z.infer<
  typeof CreateInstructionParamsSchema
>;

export const model = new ChatOpenAI({
  apiKey: import.meta.env.OPENAI_API_KEY,
  model: "gpt-4o-mini",
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

const generateInstructionDescription = async (instruction: string) => {
  const messages = [
    new SystemMessage(instructions),
    new HumanMessage(instruction),
  ];
  const parser = new StringOutputParser();
  const result = await model.invoke(messages);
  const description = await parser.invoke(result);

  return description;
};

const extractRequiredFields = (instuctions: any) => {
  return instuctions.map((instruction: any) => ({
    _id: instruction._id,
    title: instruction.title,
  }));
};

export const GET: APIRoute = async (ctx) => {
  try {
    const result = await InstructionModel.listByUser(ctx.locals.userId);
    const data = extractRequiredFields(await result.toArray());
    return new Response(JSON.stringify(data));
  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({
        message: "Error while fetching instuctions",
        error: error,
      }),
      {
        status: 500,
      },
    );
  }
};

export const POST: APIRoute<CreateInstructionParams> = async (ctx) => {
  const params = await ctx.request.json();
  const data = CreateInstructionParamsSchema.parse(params);

  // We generate a description based on the instruction
  const description = await generateInstructionDescription(data.instruction);
  // TODO: Here we would add user informations like the tenant and the user id. We don't have that
  // feature to get these just based on the token for now. Wait until the Auth0 task is done. Until
  // then we use fixed values.
  const instruction: Instruction = {
    ...data,
    description,
    tenant_id: stringToObjectId.parse(ctx.locals.tenantId), // AI now AG
    creator_id: stringToObjectId.parse(ctx.locals.userId), // admin@aibox.ch
    created_at: new Date(),
    updated_at: new Date(),
  };
  try {
    if (instruction) {
      await InstructionModel.add(instruction);

      return new Response(
        JSON.stringify({
          message: "Intruction added",
        }),
        {
          status: 200,
        },
      );
    } else {
      return new Response(
        JSON.stringify({
          message: "Error while adding the intruction",
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
        message: "Error while adding the intruction",
        error: error,
      }),
      {
        status: 500,
      },
    );
  }
};
