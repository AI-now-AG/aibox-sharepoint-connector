import { z, defineCollection } from "astro:content";

const aiboxCollection = defineCollection({
  type: "content",
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      lead: z.string(),
      image: image(),
      imageAlt: z.string(),
      tags: z.array(z.string()).optional(),
    }),
});

export const collections = {
  aibox: aiboxCollection,
};
