import { db } from "../mongodb";

export const Prompts = () => {
  return db().collection("prompts");
};

export const addPrompt = async (promptObj: any) =>
  Prompts().insertOne(promptObj);
