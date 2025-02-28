import { defineAction } from "astro:actions";
import { z } from "zod";
import { ObjectId } from "mongodb";
import KnowledgeBaseModel from "$data/models/knowledgeBase.model";
import { transformRawDataWithoutReplacer } from "$utils/transformRawData";

export const knowledgebase = {
  listByTenant: defineAction({
    input: z.object({
      tenant_id: z.string(),
    }),
    handler: async (input) => {
      const id = new ObjectId(input.tenant_id);
      const knowledgeBaseCursor = await KnowledgeBaseModel.listByTenant(id);
      const knowledgeBases = await knowledgeBaseCursor.toArray();
      return transformRawDataWithoutReplacer(knowledgeBases);
    },
  }),
};
