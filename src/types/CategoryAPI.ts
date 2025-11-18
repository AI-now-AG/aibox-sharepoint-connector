import { z } from "zod";

export const GroupParamSchema = z.object({
  _id: z.string().optional(),
  title: z.string(),
  active: z.boolean().optional(),
  position: z.number().optional(),
});

export const CreateCategoryParamsSchema = z.object({
  _id: z.string().optional(),
  title: z.string(),
  groups: z.array(GroupParamSchema),
});

export type CreateCategoryParams = z.infer<typeof CreateCategoryParamsSchema>;
export type GroupParam = z.infer<typeof GroupParamSchema>;

export const CategoryParamsSchema = z.object({
  _id: z.string(),
});

export type CategoryParams = z.infer<typeof CategoryParamsSchema>;
