import { defineAction } from "astro:actions";
import { z } from "zod";
import { transformRawData } from "$utils/transformRawData";
import ConversationModel, {
  type Conversation,
  MessageSchema,
} from "$data/models/conversation.model";
import { ObjectId } from "mongodb";

const ConversationInputIdentifierSchema = z.object({
  _id: z.string(),
});

const ConversationInputParamsSchema = z.object({
  prompt_id: z.string(),
  model: z.string().optional(),
  messages: z.array(MessageSchema),
});

const UpdateConversationSchema = ConversationInputParamsSchema.omit({
  prompt_id: true,
}).merge(ConversationInputIdentifierSchema);

export const category = {
  save: defineAction({
    input: ConversationInputParamsSchema,
    handler: async (input, context) => {
      const { model, messages, prompt_id: promptId } = input;

      if (!promptId) {
        throw new Error("promptId not found.");
      }

      const conversation: Partial<Conversation> = {
        title: "Test",
        model,
        messages,
        prompt_id: new ObjectId(promptId),
        tenant_id: context.locals.tenant._id,
        creator_id: context.locals.user.id,
      };
      const insertResult = await ConversationModel.create(conversation);
      return transformRawData(insertResult);
    },
  }),

  update: defineAction({
    input: UpdateConversationSchema,
    handler: async (input) => {
      const update: Partial<Conversation> = {
        ...input,
      };
      const updatedDocument = await ConversationModel.update(input._id, update);
      return transformRawData(updatedDocument);
    },
  }),

  delete: defineAction({
    input: ConversationInputIdentifierSchema,
    handler: async (input) => {
      const deleteResult = await ConversationModel.remove(input._id);
      return transformRawData(deleteResult);
    },
  }),
};
