import { MongoClient } from "mongodb";

if (!import.meta.env.MONGODB_URI) {
  throw new Error('Invalid environment variable: "MONGODB_URI"');
}

const options = {};

const mongo = new MongoClient(import.meta.env.MONGODB_URI, options);
const db = () => mongo.db(import.meta.env.MONGODB_DATABASE);

export const Users = () => {
  return db().collection("users");
};