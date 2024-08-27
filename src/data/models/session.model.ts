import { db } from "$data/mongodb";
import { ObjectId } from "mongodb";

import { z } from "zod";

export const SessionSchema = z.object({
  _id: z.string(),
  user_id: z.instanceof(ObjectId),
  expires_at: z.date(),
});

export type Session = z.infer<typeof SessionSchema>;

export const collection = db.collection<Session>("sessions");
