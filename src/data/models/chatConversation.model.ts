import { ObjectId } from "mongodb";
import { db, toObjectId, type Document } from "../mongodb";
import { MessageRole } from "$types/MessageHistory";
import { z } from "zod";

// Zod schema for a single Message
const MessageSchema = z.object({
  role: z.nativeEnum(MessageRole),
  content: z.string(),
  rawData: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

// Zod schema for a conversation
const ChatConversationSchema = z.object({
  tenant_id: z.instanceof(ObjectId),
  creator_id: z.instanceof(ObjectId),
  prompt_id: z.instanceof(ObjectId),
  title: z.string(),
  model: z.string().nullish(),
  messages: z.array(MessageSchema),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type ChatConversation = z.infer<typeof ChatConversationSchema>;

const collection = db.collection("chat_conversations");

export default {
  create: async (conversation: ChatConversation) => {
    const validated = ChatConversationSchema.parse(conversation);
    const doc = {
      ...validated,
    };
    return collection.insertOne(doc);
  },

  remove: async (id: string) => {
    const _id = new ObjectId(id);
    return collection.deleteOne({ _id });
  },

  listByUser: async (userId: string | ObjectId) => {
    const _userId = toObjectId(userId);
    return collection
      .find<Document<ChatConversation>>({ creator_id: _userId })
      .sort({ created_at: -1 });
  },

  get: async (id: string): Promise<ChatConversation | null> => {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    const _id = new ObjectId(id);
    const doc = await collection.findOne<Document<ChatConversation>>({ _id });
    if (!doc) return null;
    return doc;
  },
};
