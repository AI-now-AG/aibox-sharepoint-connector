import type { APIRoute } from "astro";
import PromptModel, { type Prompt } from "$data/models/prompt.model";
import { z } from "zod";

const CreatePromptParamsSchema = z.object({
  tenant_id: z.string(),
  creator_id: z.string(),
  parent_id: z.string().optional(),
  title: z.string(),
  category: z.string(),
  instructions: z.string(),
  prompt: z.string(),
  documents: z.array(z.string()),
});

export type CreatePromptParams = z.infer<typeof CreatePromptParamsSchema>;

export const POST: APIRoute<CreatePromptParams> = async (ctx) => {
  const params = await ctx.request.json();
  const prompt = CreatePromptParamsSchema.parse(params);
  console.log("NEW PROMPT", prompt);
  try {
    if (params.prompt) {
      await PromptModel.add(params);

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
