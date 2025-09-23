import { defineAction } from "astro:actions";
import { z } from "zod";
import { transformRawData } from "$utils/transformRawData";
import promptModel, { type Prompt } from "$data/models/prompt.model";
import ConfigurationModel from "$data/models/configuration.model";
import createChatModel from "$utils/chatModel";
import { htmlToMarkdown } from "$utils/textFormatting";
import { getProviderInstruction } from "$utils/providerInstruction";
import { getProviderModel } from "$shared/AIProvider";
import { ApiKeyProvider } from "$types/TenantFeature";
import {
  BaseMessage,
  SystemMessage,
  HumanMessage,
} from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";

const PromptListIdentifierSchema = z.array(
  z.object({
    _id: z.string(),
  }),
);

const PromptImprovementSchema = z.object({
  provider: z.nativeEnum(ApiKeyProvider),
  instruction: z.string().default(""),
});

/**
 * Default system instruction for prompt improvement.
 * Guides the LLM to act as a prompt engineer, refining user input
 * into a clean, structured, and effective system prompt.
 */
const DEFAULT_PROMPT_REFINEMENT_INSTRUCTION = `
You are an expert in prompt engineering. Your task is to check and rewrite a user-provided instruction so that it is suitable for use inside a system prompt for [LLM]

You make the instruction clear, structured, and easy for the model to follow. Keep it in the same language. Improve tone, structure, and remove unnecessary or confusing parts. If needed, summarize long texts or separate sub-tasks clearly.

Do NOT include any behavior already covered by the following system prompt:
[System Message LLM]

Return only the cleaned and optimized instruction, without introduction or comments.
`;

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
      // Extract provider and instruction from input (default empty string if missing)
      const { provider, instruction = "" } = input;

      // Fallback to English if tenant doesn’t have a default language
      const defaultLanguage = context.locals.tenant.default_language || "en";

      // Load global configuration (may include custom refinement instructions)
      const configuration = await ConfigurationModel.get();

      // Use tenant-defined prompt refinement instruction if available, otherwise fallback to default
      const refinementInstruction =
        configuration?.promptRefinementInstruction ||
        DEFAULT_PROMPT_REFINEMENT_INSTRUCTION;

      // Get provider-specific system instruction (customized for the chosen AI provider)
      const providerInstruction = getProviderInstruction(
        configuration,
        provider,
        "",
        defaultLanguage,
      );

      // Identify which model is tied to this provider
      const providerModel = getProviderModel(context.locals.tenant, provider);

      // Normalize user instruction from HTML → Markdown (ensures consistent formatting)
      const markdownInstruction = htmlToMarkdown(instruction);

      // Build the system message for the LLM, replacing placeholders with actual values
      const systemMessage = refinementInstruction
        ?.replaceAll("[LLM]", providerModel)
        ?.replaceAll("[System Message LLM]", providerInstruction || "");

      // Wrap user input as a human message
      const humanMessage = `${markdownInstruction}`;

      try {
        // Initialize the chat model for this request
        const chatModel = createChatModel(context);

        // Construct a conversation history with system + human messages
        const messages: BaseMessage[] = [
          new SystemMessage(systemMessage),
          new HumanMessage(humanMessage),
        ];

        // Send messages to the LLM and await a response
        const result = await chatModel.invoke(messages);

        // Parse raw model output into a clean string
        const parser = new StringOutputParser();
        const improvedInstruction = await parser.invoke(result);

        // Log details for debugging and monitoring
        console.log("Prompt Refinement Message", {
          systemMessage,
          humanMessage,
        });
        console.log("Prompt Refinement Result", {
          originInstruction: markdownInstruction,
          improvedInstruction,
        });

        // Return the refined prompt back to the caller
        return improvedInstruction;
      } catch (error) {
        console.error("Error in improvePrompt action:", error);
        throw new Error("Failed to improve prompt. Please try again.");
      }
    },
  }),
};
