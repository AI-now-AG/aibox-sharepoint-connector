import { defineAction } from "astro:actions";
import { ObjectId } from "mongodb";
import { client } from "$data/mongodb";
import { z } from "zod";
import { transformRawData } from "$utils/transformRawData";
import TranscriptionModel, {
  type Transcription,
} from "$data/models/transcription.model";
import { clearAllCache } from "$utils/cache";
import { AudioCategory } from "$types/TenantFeature";

const TranscribeInputParamsSchema = z.object({
  tenant_id: z.string(),
  user_id: z.instanceof(ObjectId).optional(),
  name: z.string().min(1),
  category: z.nativeEnum(AudioCategory),
  enabled: z.boolean().default(true),
  text: z.string().optional(),
});

const TranscribeUpdateInputParamsSchema = z.object({
  _id: z.string(),
  tenant_id: z.string(),
  user_id: z.instanceof(ObjectId).optional(),
  name: z.string().min(1),
  category: z.nativeEnum(AudioCategory),
  enabled: z.boolean().default(true),
  text: z.string().optional(),
});

const TranscribeInputIdentifierSchema = z.object({
  _id: z.string(),
});

export const transcription = {
  get: defineAction({
    input: TranscribeInputIdentifierSchema,
    handler: async (input) => {
      const data = await TranscriptionModel.get(input._id);
      return transformRawData(data);
    },
  }),

  create: defineAction({
    input: TranscribeInputParamsSchema,
    handler: async (input, context) => {
      const session = client.startSession();
      session.startTransaction();
      try {
        const update: Partial<Transcription> = {
          ...input,
          tenant_id: new ObjectId(input.tenant_id),
        };
        const insertResult = await TranscriptionModel.add(update);
        await session.commitTransaction();

        // clear all cache entries for this tenant
        clearAllCache(context.locals.tenant._id?.toString());

        return transformRawData(insertResult);
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    },
  }),

  update: defineAction({
    input: TranscribeUpdateInputParamsSchema,
    handler: async (input, context) => {
      const session = client.startSession();
      session.startTransaction();
      try {
        const update: Partial<Transcription> = {
          ...input,
          _id: new ObjectId(input._id),
          tenant_id: new ObjectId(input.tenant_id),
          updated_at: new Date(),
        };
        const updatedDocument = await TranscriptionModel.update(
          input._id,
          update,
        );

        await session.commitTransaction();

        // clear all cache entries for this tenant
        clearAllCache(context.locals.tenant._id?.toString());

        return transformRawData(updatedDocument);
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    },
  }),

  active: defineAction({
    input: TranscribeInputIdentifierSchema,
    handler: async (input, context) => {
      const updateResult = await TranscriptionModel.updateActiveStatus(
        input._id,
        true,
      );

      // clear all cache entries for this tenant
      clearAllCache(context.locals.tenant._id?.toString());

      return transformRawData(updateResult);
    },
  }),

  deactive: defineAction({
    input: TranscribeInputIdentifierSchema,
    handler: async (input, context) => {
      const updateResult = await TranscriptionModel.updateActiveStatus(
        input._id,
        false,
      );

      // clear all cache entries for this tenant
      clearAllCache(context.locals.tenant._id?.toString());

      return transformRawData(updateResult);
    },
  }),

  delete: defineAction({
    input: TranscribeInputIdentifierSchema,
    handler: async (input, context) => {
      const transcription = await TranscriptionModel.get(input._id);
      if (!transcription) throw new Error("Transcription does not exist.");

      const session = client.startSession();

      try {
        session.startTransaction();
        await TranscriptionModel.remove(input._id);
        await session.commitTransaction();

        // clear all cache entries for this tenant
        clearAllCache(context.locals.tenant._id?.toString());

        return transformRawData({});
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    },
  }),
};
