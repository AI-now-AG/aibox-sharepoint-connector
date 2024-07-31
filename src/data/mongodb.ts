import { MongoClient, ObjectId } from "mongodb";

if (!import.meta.env.MONGODB_URI) {
  throw new Error('Invalid environment variable: "MONGODB_URI"');
}

const options = {};

const mongo = new MongoClient(import.meta.env.MONGODB_URI, options);
export const db = () => mongo.db(import.meta.env.MONGODB_DATABASE);

