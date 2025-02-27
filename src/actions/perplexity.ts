import { defineAction } from "astro:actions";
import { z } from "zod";
import initializeOpenAI from "$utils/chatModel";
import type { APIContext } from "astro";

export const perplexity = {
  chat: defineAction({
    input: z.object({
      message: z.array(z.any()),
      options: z.any().optional().default({}),
    }),
    handler: async (input, context) => {
      const { message, options = {} } = input;
      const model = initializeOpenAI(context as APIContext);
      const response = await model.invoke(message, options);
      return response;
    },
  }),
};
