import { MongoClient, ObjectId } from "mongodb";
import getEnvVar from "$utils/getEnvVar";

const url = getEnvVar("MONGODB_URI");
const dbName = getEnvVar("MONGODB_DATABASE");

if (!url) {
  throw new Error('Invalid environment variable: "MONGODB_URI"');
}

export type Document<T> = T & {
  _id: ObjectId;
};

const options = {};

export const client = new MongoClient(url, options);
export const db = client.db(dbName);

export function toObjectId(id: string | ObjectId): ObjectId {
  return id instanceof ObjectId ? id : new ObjectId(id);
}
