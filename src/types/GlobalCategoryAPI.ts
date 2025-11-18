import { z } from "zod";
import { GroupParamSchema, CategoryParamsSchema } from "./CategoryAPI";
export {
  GroupParamSchema,
  CategoryParamsSchema,
  type CategoryItem,
  type CategoryList,
} from "./CategoryAPI";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const CreateCategoryParamsSchema = z.object({
  _id: z.string().optional(),
  title: z.string(),
  groups: z.array(GroupParamSchema),
  tags: z.array(z.string()),
});

export type CreateCategoryParams = z.infer<typeof CreateCategoryParamsSchema>;
export type CategoryParams = z.infer<typeof CategoryParamsSchema>;
export type GroupParam = z.infer<typeof GroupParamSchema>;
