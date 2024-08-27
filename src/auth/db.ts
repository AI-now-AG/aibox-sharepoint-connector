// TODO move to model
import { MongodbAdapter } from "@lucia-auth/adapter-mongodb";
import { ObjectId } from "mongodb";
import { db } from "$data/mongodb";

export interface UserDoc {
  _id: ObjectId;
  auth0_sub: string;
  tenant_id: ObjectId;
  username: string;
  email: string;
}

export interface SessionDoc {
  _id: string;
  user_id: ObjectId;
  expires_at: Date;
}

export const User = db.collection<UserDoc>("oauth_users");
export const Session = db.collection<SessionDoc>("sessions");

export const adapter = new MongodbAdapter(Session, User);
