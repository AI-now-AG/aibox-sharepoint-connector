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

import { Users } from "./mongodb";

export const getUserByEmailAndPassword = async (email: string, password: string) => {
    const user = await (await Users()).findOne({ email, password });
    return user
    //return usersCollection.findOne({ email, password });
}

export const getAllUsers = async () => {
  const users = await (await Users()).find({}).toArray();
  return users;
};
