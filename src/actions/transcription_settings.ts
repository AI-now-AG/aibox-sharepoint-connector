import { defineAction } from "astro:actions";
import { z } from "zod";
import TenantModel, { type Tenant } from "$data/models/tenant.model";
import { transformRawData } from "$utils/transformRawData";
import { AudioCategory } from "$types/TenantFeature";

export const InputParamsSchema = z.object({
  _id: z.string(),
  audioCategory: z.array(z.nativeEnum(AudioCategory)),
  enabled: z.boolean().default(false),
});

export const transcription_settings = {
  update: defineAction({
    input: InputParamsSchema,
    handler: async (input) => {
      const { _id, audioCategory } = input;
      if (!audioCategory) {
        throw new Error("No transcription settings provided.");
      }

      const tenant = await TenantModel.get(_id);
      if (!tenant) {
        throw new Error("Tenant not found.");
      }

      const existingTranscriptions = tenant.transcription_types || [];

      // const transcriptionUpdate: Partial<Tenant["transcription_types"]> = {
      //   ...existingTranscriptions,
      //   ...audioCategory,
      // };

      // const transcriptionUpdate: AudioCategory[] = [
      //   ...existingTranscriptions,
      //   ...audioCategory.filter(
      //     (category): category is AudioCategory => category !== undefined,
      //   ),
      // ];

      const transcriptionUpdate: AudioCategory[] = input.enabled
        ? [
            ...new Set([
              ...audioCategory.filter(
                (category): category is AudioCategory => category !== undefined,
              ),
              ...existingTranscriptions,
            ]),
          ]
        : existingTranscriptions.filter(
            (category) => !audioCategory.includes(category),
          );

      if (!transcriptionUpdate) {
        throw new Error("No valid transcription settings to update.");
      }

      const update: Partial<Tenant> = {
        transcription_types: transcriptionUpdate,
        updated_at: new Date(),
      };
      const updatedDocument = await TenantModel.update(_id, update);

      return transformRawData(updatedDocument);
    },
  }),
};
