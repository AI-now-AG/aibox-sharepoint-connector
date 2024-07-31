import { db } from "../mongodb";

export const Categories = () => {
  return db().collection("categories");
};

export const addCategory = async (category: any) =>
  Categories().insertOne(category);

export const categories = async () => Categories().find({});
