import { ObjectId } from "mongodb";
import { db, toObjectId, type Document } from "../mongodb";
import { MessageRole, MessageThumbRating } from "$types/MessageHistory";
import { z } from "zod";

// Zod schema for a single Message
export const MessageSchema = z.object({
  role: z.nativeEnum(MessageRole),
  content: z.string(),
  rawData: z.string().nullish().default(null),
  imageUrl: z.string().nullish().default(null),
  fileUrls: z.array(z.string()).optional().default([]),
  thumbRating: z.nativeEnum(MessageThumbRating).nullish().default(null),
});

// Zod schema for a conversation
const ChatConversationSchema = z.object({
  _id: z.instanceof(ObjectId),
  tenant_id: z.instanceof(ObjectId),
  creator_id: z.instanceof(ObjectId),
  prompt_id: z.instanceof(ObjectId).nullish().default(null),
  title: z.string(),
  model: z.string().nullish().default(null),
  previous_response_id: z.string().nullish().default(null),
  messages: z.array(MessageSchema),
  created_at: z
    .date()
    .optional()
    .default(() => new Date()),
  updated_at: z
    .date()
    .optional()
    .default(() => new Date()),
  expires_at: z
    .date()
    .optional()
    .default(() => {
      const d = new Date();
      d.setDate(d.getDate() + 30); // add 30 days
      return d;
    }),
});

export type Message = z.infer<typeof MessageSchema>;
export type Conversation = z.infer<typeof ChatConversationSchema>;

const collection = db.collection<Conversation>("conversations");

export default {
  create: async (conversation: Partial<Omit<Conversation, "_id">>) => {
    const validated = ChatConversationSchema.parse({
      _id: new ObjectId(),
      ...conversation,
    });
    const doc = {
      ...validated,
    };
    return collection.insertOne(doc);
  },

  update: async (id: string | ObjectId, update: Partial<Conversation>, isReturnUpdatedData: boolean = true) => {
    const objectId = toObjectId(id);
    const validated = ChatConversationSchema.partial().parse(update);

    const expiresAt = (() => {
      const d = new Date();
      d.setDate(d.getDate() + 30); // add 30 days
      return d;
    })();

    const doc = {
      ...validated,
      updated_at: new Date(),
      expires_at: expiresAt,
    };

    const updatedDocument = await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: doc },
      {
        returnDocument: "after",
      },
    );

    if (isReturnUpdatedData) {
      return updatedDocument
    }
    return { success: true }
  },

  // New function to update the messages array using $push
  updateMessage: async (id: string | ObjectId, message: Message) => {
    const objectId = toObjectId(id);

    // Validate the incoming message object
    const validatedMessage = MessageSchema.parse(message);

    return await collection.findOneAndUpdate(
      { _id: objectId },
      {
        $push: { messages: validatedMessage },
        $set: {
          updated_at: new Date(),
        },
      },
      {
        returnDocument: "after",
      },
    );
  },
  updateMessageRating: async (
    id: string | ObjectId,
    messageIndex: number,
    newRating: MessageThumbRating | null
  ) => {
    const objectId = toObjectId(id);

    if (!["up", "down", "cancel", null].includes(newRating)) {
      throw new Error("Invalid rating value");
    }

    return await collection.findOneAndUpdate(
      { _id: objectId },
      {
        $set: {
          [`messages.${messageIndex}.thumbRating`]: newRating,
          updated_at: new Date()
        },
      },
      {
        returnDocument: "after",
      }
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

  listByUser: async (userId: string | ObjectId, limit = 500) => {
    const _userId = toObjectId(userId);
    return collection
      .find<Document<Conversation>>({ creator_id: _userId })
      .sort({ updated_at: -1 })
      .limit(limit)
      .toArray();
  },
};
