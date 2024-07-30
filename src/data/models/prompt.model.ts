import { Prompts, ObjectId } from "../mongodb";

export const addPrompt = async (promptObj: any) => Prompts().insertOne(promptObj);
