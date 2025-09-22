import { defineAction } from "astro:actions";
import { z } from "zod";
import { transformRawData } from "$utils/transformRawData";
import promptModel, { type Prompt } from "$data/models/prompt.model";
import { Provider } from "$types/AIProvider";
import initializeOpenAI from "$utils/chatModel";
import { SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";

const PromptListIdentifierSchema = z.array(
  z.object({
    _id: z.string(),
  }),
);

const PromptImprovementSchema = z.object({
  instruction: z.string().optional(),
  aiProvider: z.nativeEnum(Provider).optional(),
  improveForLLM: z.nativeEnum(Provider),
  llmSystemMessage: z.string().default(""),
})


/**
 * This is the system instruction for the LLM, defining its role and task.
 * It instructs the model to act as a prompt engineer and improve the user's input.
 */
const DEAULT_SYSTEM_INSTRCUTION_FOR_PROMPT_IMPROVEMENT = `You are an expert in prompt engineering. Your task is to check and rewrite a user-provided instruction so that it is suitable for use inside a system prompt for [LLM]

You make the instruction clear, structured, and easy for the model to follow. Keep it in the same language. Improve tone, structure, and remove unnecessary or confusing parts. If needed, summarize long texts or separate sub-tasks clearly.

Do NOT include any behavior already covered by the following hardcoded system prompt:
[System Message LLM]

Return only the cleaned and optimized instruction, without introduction or comments.`;


export const prompt = {
  updatePosition: defineAction({
    input: PromptListIdentifierSchema,
    handler: async (input) => {
      const items: Prompt[] = [];
      for (const [index, item] of input.entries()) {
        const updateResult = await promptModel.findAndUpdate(item._id, {
          position: index,
        });
        items.push(transformRawData(updateResult));
      }
      return items;
    },
  }),

  improvePrompt: defineAction({
    input: PromptImprovementSchema,
    handler: async (input, context) => {
      console.log("improvePrompt input", input)

      // eslint-disable-next-line prefer-const
      let { instruction = DEAULT_SYSTEM_INSTRCUTION_FOR_PROMPT_IMPROVEMENT, aiProvider, improveForLLM, llmSystemMessage = '' } = input
      instruction = instruction?.replace('[LLM]', improveForLLM)?.replace('[System Message LLM]', llmSystemMessage)

      try {
        let chatModel
        switch (aiProvider) {
          case Provider.Perplexity:
          case Provider.Claude:
          case Provider.Gemini:
          case Provider.OpenAI:
          default:
            chatModel = initializeOpenAI(context)
            break
        }
        const messages = [
          new SystemMessage(instruction)
        ];

        const result = await chatModel.invoke(messages);
        const parser = new StringOutputParser();
        const improvedInstruction = await parser.invoke(result);
        console.log({ originInstruction: llmSystemMessage, improvedInstruction })
        return improvedInstruction;
      } catch (error) {
        console.error('Error in improvePrompt action:', error);
        throw new Error('Failed to improve prompt. Please try again.');
      }
    },
  }),
};
