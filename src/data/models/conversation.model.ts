import { ObjectId } from "mongodb";
import { db, toObjectId, type Document } from "../mongodb";
import { MessageRole } from "$types/MessageHistory";
import { z } from "zod";

// Zod schema for a single Message
export const MessageSchema = z.object({
  role: z.nativeEnum(MessageRole),
  content: z.string(),
  rawData: z.string().nullish().default(null),
  imageUrl: z.string().nullish().default(null),
});

// Zod schema for a conversation
const ChatConversationSchema = z.object({
  tenant_id: z.instanceof(ObjectId),
  creator_id: z.instanceof(ObjectId),
  prompt_id: z.instanceof(ObjectId).nullish().default(null),
  title: z.string(),
  model: z.string().nullish().default(null),
  previous_response_id: z.string().nullish().default(null),
  messages: z.array(MessageSchema),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type Message = z.infer<typeof MessageSchema>;
export type Conversation = z.infer<typeof ChatConversationSchema>;

const collection = db.collection("conversations");

export default {
  create: async (conversation: Partial<Omit<Conversation, "_id">>) => {
    const validated = ChatConversationSchema.parse(conversation);
    const doc = {
      ...validated,
    };
    return collection.insertOne(doc);
  },

  update: async (id: string | ObjectId, update: Partial<Conversation>) => {
    const objectId = toObjectId(id);
    const validated = ChatConversationSchema.partial().parse(update);
    const doc = {
      ...validated,
      updated_at: new Date(),
    };
    return await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: doc },
      {
        returnDocument: "after",
      },
    );
  },

  remove: async (id: string) => {
    const _id = new ObjectId(id);
    return collection.deleteOne({ _id });
  },

  get: async (id: string | ObjectId): Promise<Conversation | null> => {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    const _id = toObjectId(id);
    const doc = await collection.findOne<Document<Conversation>>({ _id });
    if (!doc) return null;
    return doc;
  },

  countByUser: async (userId: string | ObjectId) => {
    const _userId = toObjectId(userId);
    return await collection.countDocuments({
      creator_id: _userId,
    });
  },

  listByUser: async (userId: string | ObjectId) => {
    const _userId = toObjectId(userId);
    const data = collection
      .find<Document<Conversation>>({ creator_id: _userId })
      .sort({ created_at: -1 });
    return await data.toArray();
  },
};
