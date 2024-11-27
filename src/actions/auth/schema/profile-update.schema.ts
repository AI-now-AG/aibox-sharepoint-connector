import { z } from "zod";

export const ProfileUpdateSchema = z.object({
  id: z.string(),
  auth0Sub: z.string(),
  name: z.string(),
});
