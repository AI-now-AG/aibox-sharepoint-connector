import { MongoClient, ObjectId } from "mongodb";

const url = import.meta.env.MONGODB_URI || process.env.MONGODB_URI;
const dbName = import.meta.env.MONGODB_DATABASE || process.env.MONGODB_DATABASE;

if (!url) {
  throw new Error('Invalid environment variable: "MONGODB_URI"');
}

export type Document<T> = T & {
  _id: ObjectId;
};

const options = {};

export const client = new MongoClient(url, options);
export const db = client.db(dbName);
