import { defineAction } from "astro:actions";
import { z } from "zod";
import TenantModel, {
  type Tenant,
  TranscriptionsSchema,
} from "$data/models/tenant.model";
import { transformRawData } from "$utils/transformRawData";

export const InputParamsSchema = z.object({
  _id: z.string(),
  transcriptions: TranscriptionsSchema,
});

export const transcription_settings = {
  update: defineAction({
    input: InputParamsSchema,
    handler: async (input) => {
      const { _id, transcriptions } = input;
      if (!transcriptions) {
        throw new Error("No transcription settings provided.");
      }

      const tenant = await TenantModel.get(_id) as Tenant;
      if (!tenant) {
        throw new Error("Tenant not found.");
      }

      const existingTranscriptions = tenant.transcriptions || {};

      const transcriptionUpdate: Partial<Tenant["transcriptions"]> = {
        ...existingTranscriptions,
        ...transcriptions,
      };

      if (!Object.keys(transcriptionUpdate).length) {
        throw new Error("No valid transcription settings to update.");
      }

      const update: Partial<Tenant> = {
        transcriptions: transcriptionUpdate,
        updated_at: new Date(),
      };
      const updatedDocument = await TenantModel.update(_id, update);

      return transformRawData(updatedDocument);
    },
  }),
};
