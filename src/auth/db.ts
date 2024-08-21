// TODO move to model
import { MongodbAdapter } from "@lucia-auth/adapter-mongodb";
import { Collection } from "mongodb";
import { db } from "$data/mongodb";

export interface UserDoc {
  _id: string;
  auth0_id: string;
  tenant_id: string;
  username: string;
  email: string;
}

export interface SessionDoc {
  _id: string;
  expires_at: Date;
  user_id: string;
}

export const User = db.collection("oauth_users") as Collection<UserDoc>;
export const Session = db.collection("sessions") as Collection<SessionDoc>;

export const adapter = new MongodbAdapter(Session, User);
