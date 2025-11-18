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

export const CategoryItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  tags: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});

export const CategoryListSchema = z.object({
  updated: z.boolean(),
  items: z.array(CategoryItemSchema),
});

export type CategoryItem = z.infer<typeof CategoryItemSchema>;
export type CategoryList = z.infer<typeof CategoryListSchema>;
