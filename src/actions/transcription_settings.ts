import { defineAction } from "astro:actions";
import { ObjectId } from "mongodb";
import { z } from "zod";
import tenantModel, { type Tenant } from "$data/models/tenant.model";
import { transformRawData } from "$utils/transformRawData";

const InputParamsSchema = z.object({
  _id: z.string(),
  instructions: z.string(),
});

export const transcription_settings = {
  update: defineAction({
    input: InputParamsSchema,
    handler: async (input) => {
      const update: Partial<Tenant> = {
        ...{ transcription_instructions: input.instructions },
        ...{ _id: new ObjectId(input._id) },
      };
      const updatedDocument = await tenantModel.update(input._id, update);

      return transformRawData(updatedDocument);
    },
  }),
};
