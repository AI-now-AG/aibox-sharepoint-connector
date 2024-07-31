// import { MongoClient } from 'mongodb';

// interface User {
//   _id: string;
//   username: string;
//   password: string;
// }

// const client = new MongoClient(import.meta.env.MONGODB_URI);
// const db = client.db();
// const usersCollection = db.collection<User>('users');

// export async function getUserByUsernameAndPassword(username: string, password: string) {
//   return usersCollection.findOne({ username, password });
// }

import { db } from "../mongodb";

export const Users = () => {
  return db().collection("users");
};

export const getUser = async (email: string) => Users().findOne({ email });
