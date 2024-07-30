import { Categories, ObjectId } from "../mongodb";

export const addCategory = async (cateogryObj: any) => Categories().insertOne(cateogryObj);

export const categories = async () => Categories().find({}).toArray();

export { ObjectId };
