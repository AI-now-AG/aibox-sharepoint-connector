import { ObjectId } from "mongodb";
import { z } from "zod";

export const stringToObjectId = z
  .string()
  .transform((id: string) => new ObjectId(id));
