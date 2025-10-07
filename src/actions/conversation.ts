import { defineAction, type ActionAPIContext } from "astro:actions";
import { z } from "zod";
import { transformRawData } from "$utils/transformRawData";
import ConversationModel, {
  type Conversation,
  MessageSchema,
} from "$data/models/conversation.model";
import PromptModel from "$data/models/prompt.model";
import { ObjectId } from "mongodb";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import createChatModel from "$utils/chatModel";

const ConversationInputIdentifierSchema = z.object({
  _id: z.string(),
});

const ConversationInputParamsSchema = z.object({
  title: z.string().optional(),
  prompt_id: z.string().nullish(),
  model: z.string().nullish(),
  previous_response_id: z.string().nullish(),
  messages: z.array(MessageSchema),
});

const UpdateConversationSchema = ConversationInputParamsSchema.omit({
  prompt_id: true,
}).merge(ConversationInputIdentifierSchema);

// The input schema for appending a new message
export const AppendMessageSchema = z.object({
  _id: z.string(), // The conversation ID
  message: MessageSchema, // The new message to append
});

const ConversationListSchema = z.object({
  limit: z.number().min(0).optional(),
});

const generateConversationTitle = async (
  ctx: ActionAPIContext,
  promptTitle: string,
  userInput: string,
) => {
  const model = createChatModel(ctx);

  const instructionsWithPrompt = `
    Generate a short conversation title of max 30 characters. 
    The title must summarize prompt title and user input to fit on a navigation. 
    Write it in the same language as the user input. 
    If the language cannot be determined, default to German.
  `;
  const instructionsWithoutPrompt = `
    Generate a short conversation title max 30 characters. 
    The title must summarize the user input to fit on a navigation. 
    Write it in the same language as the user input. 
    If the language cannot be determined, default to German.
  `;

  const hasPrompt = promptTitle.trim().length > 0;
  const instructions = hasPrompt
    ? instructionsWithPrompt
    : instructionsWithoutPrompt;
  const humanMessage = hasPrompt
    ? `Prompt title: ${promptTitle}\nUser input: ${userInput}`
    : `User input: ${userInput}`;

  const messages = [
    new SystemMessage(instructions),
    new HumanMessage(humanMessage),
  ];
  const parser = new StringOutputParser();
  const result = await model.invoke(messages);
  const description = await parser.invoke(result);

  console.log("Generate conversation title - chat model messages", messages);

  return description;
};

export const conversation = {
  get: defineAction({
    input: ConversationInputIdentifierSchema,
    handler: async (input) => {
      // Fetch a single conversation by its ID
      const data = await ConversationModel.get(input._id);

      // Normalize and return the conversation
      return transformRawData(data);
    },
  }),

  list: defineAction({
    input: ConversationListSchema,
    handler: async (input, context) => {
      // Get the current user ID from the request context
      const userId = context.locals.user.id;

      // Fetch all conversations created by this user
      const data = await ConversationModel.listByUser(userId, input.limit);

      // Normalize and return the list of conversations
      return transformRawData(data, false);
    },
  }),

  save: defineAction({
    input: ConversationInputParamsSchema,
    handler: async (input, context) => {
      // Destructure the validated input
      const {
        model,
        messages,
        prompt_id: promptId,
        previous_response_id: previousResponseId,
      } = input;
      let promptTitle = "";

      // Fetch the prompt definition from the database
      if (promptId) {
        const prompt = await PromptModel.get(promptId);
        if (!prompt) {
          throw new Error("Prompt not found.");
        }
        promptTitle = prompt.title;
      }

      // Generate a short conversation title based on:
      // - the stored prompt title
      // - the most recent user message (last message in the array)
      const generatedTitle = await generateConversationTitle(
        context,
        promptTitle,
        messages[0].content,
      );

      // Build the conversation object to be persisted
      const conversation: Partial<Conversation> = {
        title: generatedTitle || "Test",
        model,
        messages,
        prompt_id: promptId ? new ObjectId(promptId) : null,
        tenant_id: context.locals.tenant._id,
        creator_id: context.locals.user.id,
        previous_response_id: previousResponseId,
      };

      // Save the conversation and return the transformed result
      const insertResult = await ConversationModel.create(conversation);
      return transformRawData(insertResult);
    },
  }),

  update: defineAction({
    input: UpdateConversationSchema,
    handler: async (input) => {
      // Prepare the fields to update from the validated input
      const update: Partial<Conversation> = {
        ...input,
      };

      // Update the conversation document by ID
      const updatedDocument = await ConversationModel.update(input._id, update);

      // Normalize and return the updated conversation
      return transformRawData(updatedDocument);
    },
  }),

  // New action to append a message to a conversation
  updateMessage: defineAction({
    input: AppendMessageSchema,
    handler: async (input) => {
      // The handler now uses a more specific model function
      const updatedDocument = await ConversationModel.updateMessage(
        input._id,
        input.message,
      );
      // Transform and return the updated conversation
      return transformRawData(updatedDocument);
    },
  }),

  delete: defineAction({
    input: ConversationInputIdentifierSchema,
    handler: async (input) => {
      // Remove the conversation document by ID
      const deleteResult = await ConversationModel.remove(input._id);

      // Normalize and return the deletion result
      return transformRawData(deleteResult);
    },
  }),
};
