import { MongoClient } from "mongodb";

if (!import.meta.env.MONGODB_URI) {
  throw new Error('Invalid environment variable: "MONGODB_URI"');
}

const options = {};

const mongo = await new MongoClient(
  import.meta.env.MONGODB_URI,
  options,
).connect();
const db = () => mongo.db(import.meta.env.MONGODB_DATABASE);

export const Users = async () => {
  return db().collection("users");
};

