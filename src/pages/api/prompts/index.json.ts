import type { APIContext, APIRoute } from "astro";
import PromptModel, { type Prompt } from "$data/models/prompt.model";
import { z } from "zod";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { stringToObjectId } from "$utils/stringToObjectId";
import KnowledgeBaseModel, {
  type KnowledgeBase,
} from "$data/models/knowledgeBase.model";
import initializeOpenAI from "$utils/chatModel";

const CreatePromptParamsSchema = z.object({
  _id: z.string().optional(),
  title: z.string(),
  category: z.string().optional(),
  group: z.string().optional(),
  knowledgebase: z.array(z.string().optional()),
  prompt: z.string(),
  predefined_input: z.string().optional(),
  model: z.string().nullish(),
  reasoningEffort: z.string().nullish(),
  textVerbosity: z.string().nullish(),
  promptTool: z.string().nullish(),
  documents: z.array(z.string()).optional(),
});

export type CreatePromptParams = z.infer<typeof CreatePromptParamsSchema>;
const PromptParamsSchema = z.object({
  _id: z.string(),
});

export type PromptParams = z.infer<typeof PromptParamsSchema>;

const instructions = `You are a helpful assistant who writes helpful descriptions of prompts for users that will use these prompts for a UI:
* You receive a prompt
* You create a friendly description of the prompt, describing what it does and what it is about, to the user that is using this prompt.
* Use at most 2 sentences
* Return just the description, without any formatting or the prompt
* The description must be german and target a swiss audience
* Use a friendly and personal tone
* Only describe what the prompt does, do not add a call to action

Example:
Input: Erstelle eine Titel für einen Schweizer Presseartikel im Stil von "Knowledge Base Somedia-Schlagzeilen" und "Instructions Headline" auf Basis der folgenden Texteingabe. Stelle sicher, dass die Schlagzeilen dem Stil und den Erwartungen der Schweizer Presseartikel und sowie der vorhandenen Knowledge Base entsprechen. Befolge die angegebenen spezifischen Instruktionen.

Output: Hier kannst du einen prägnanten Titel für einen Schweizer Presseartikel erstellen, der den spezifischen Anforderungen und dem gewünschten Stil entspricht. Die Überschrift wird an die Erwartungen der Schweizer Medien angepasst und berücksichtigt die vorhandene Knowledge Base.`;

const generatePromptDescription = async (ctx: APIContext, prompt: string) => {
  const model = initializeOpenAI(ctx);

  const messages = [new SystemMessage(instructions), new HumanMessage(prompt)];
  const parser = new StringOutputParser();

  const result = await model.invoke(messages);
  const description = await parser.invoke(result);

  return description;
};

export const POST: APIRoute<CreatePromptParams> = async (ctx) => {
  const params = await ctx.request.json();
  const data = CreatePromptParamsSchema.parse(params);

  // We generate a description based on the prompt
  const description = await generatePromptDescription(ctx, data.prompt);

  // Determine the new position
  const _group = stringToObjectId.parse(data.group ?? "");
  const maxPositionPrompt = await PromptModel.getMaxPosition(_group);
  const newPosition = maxPositionPrompt
    ? (maxPositionPrompt?.position || 0) + 1
    : 1;

  // TODO: Here we would add user informations like the tenant and the user id. We don't have that
  // feature to get these just based on the token for now. Wait until the Auth0 task is done. Until
  // then we use fixed values.
  const prompt: Prompt = {
    ...data,
    category: data.category ? stringToObjectId.parse(data.category) : undefined,
    group: data.group ? stringToObjectId.parse(data.group) : undefined,
    knowledgebase: data.knowledgebase?.map((inst) =>
      stringToObjectId.parse(inst),
    ),
    documents: data.documents?.map((doc) => stringToObjectId.parse(doc)),
    description,
    position: newPosition,
    tenant_id: ctx.locals.user.tenant_id,
    creator_id: ctx.locals.user.id,
    created_at: new Date(),
    updated_at: new Date(),
  };

  try {
    if (prompt) {
      await PromptModel.add(prompt);

      return new Response(
        JSON.stringify({
          message: "Prompt added",
        }),
        {
          status: 200,
        },
      );
    } else {
      return new Response(
        JSON.stringify({
          message: "Error while adding the prompt",
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
        message: "Error while adding the prompt",
        error: error,
      }),
      {
        status: 500,
      },
    );
  }
};

export const PUT: APIRoute<CreatePromptParams> = async (ctx) => {
  const params = await ctx.request.json();
  const data = CreatePromptParamsSchema.parse(params);

  // We generate a description based on the prompt
  const description = await generatePromptDescription(ctx, data.prompt);

  const prompt: Prompt = {
    ...data,
    category: data.category ? stringToObjectId.parse(data.category) : undefined,
    group: data.group ? stringToObjectId.parse(data.group) : undefined,
    knowledgebase: data.knowledgebase?.map((inst) =>
      stringToObjectId.parse(inst),
    ),
    documents: data.documents?.map((doc) => stringToObjectId.parse(doc)),
    description,
    updated_at: new Date(),
  };

  try {
    if (prompt && data._id) {
      await PromptModel.update(data._id, prompt);

      return new Response(
        JSON.stringify({
          message: "Prompt updated",
        }),
        {
          status: 200,
        },
      );
    } else {
      return new Response(
        JSON.stringify({
          message: "Error while updating the prompt",
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
        message: "Error while updating the prompt",
        error: error,
      }),
      {
        status: 500,
      },
    );
  }
};

export const GET: APIRoute = async (ctx) => {
  try {
    const promptId = ctx.url.searchParams.get("_id");

    if (promptId) {
      const prompt = await PromptModel.get(promptId);
      if (!prompt) {
        return new Response(
          JSON.stringify({
            message: "prompt not found",
          }),
          {
            status: 400,
          },
        );
      }

      let knowledgebases: KnowledgeBase[] = [];
      if (prompt?.knowledgebase) {
        const calls = prompt.knowledgebase.map(async (kb) => {
          const instruction = await KnowledgeBaseModel.get(kb.toString());
          return instruction;
        });
        knowledgebases = (await Promise.all(calls)).filter((kb) => kb !== null);
      }

      const promptData = {
        title: prompt.title,
        prompt: prompt.prompt,
        model: prompt.model,
        reasoningEffort: prompt.reasoningEffort,
        textVerbosity: prompt.textVerbosity,
        promptTool: prompt.promptTool,
        knowledgebase: knowledgebases.map((kb) => ({
          _id: kb._id,
          title: kb.title,
          knowledge_base: kb.knowledge_base,
        })),
        category: prompt.category,
        group: prompt.group,
        predefined_input: prompt.predefined_input,
      };

      return new Response(JSON.stringify(promptData));
    } else {
      return new Response(
        JSON.stringify({
          message: "Id error while fetching the prompt",
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
        message: "Error while fetching prompt",
        error: error,
      }),
      {
        status: 500,
      },
    );
  }
};

export const DELETE: APIRoute<PromptParams> = async (ctx) => {
  try {
    const params = await ctx.request.json();
    const data = PromptParamsSchema.parse(params);

    if (data._id) {
      const result = await PromptModel.remove(data._id.toString());
      return new Response(JSON.stringify(result));
    } else {
      return new Response(
        JSON.stringify({
          message: "Id error while deleting the prompt",
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
        message: "Error while deleting prompt",
        error: error,
      }),
      {
        status: 500,
      },
    );
  }
};
