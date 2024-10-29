import { defineAction } from "astro:actions";
import { ObjectId } from "mongodb";
import { z } from "zod";
import tenantModel, {
  type Tenant,
  type Instructions,
} from "$data/models/tenant.model";
import { transformRawData } from "$utils/transformRawData";

const InputParamsSchema = z.object({
  _id: z.string(),
  transcription_subtitle: z.string(),
  transcription_plaintext: z.string(),
});

export const transcription_settings = {
  update: defineAction({
    input: InputParamsSchema,
    handler: async (input) => {
      const { transcription_subtitle, transcription_plaintext } = input;
      const instructions: Instructions = {
        transcription_subtitle,
        transcription_plaintext,
      };
      const update: Partial<Tenant> = {
        ...{ instructions },
        ...{ _id: new ObjectId(input._id) },
      };
      const updatedDocument = await tenantModel.update(input._id, update);

      return transformRawData(updatedDocument);
    },
  }),
};
