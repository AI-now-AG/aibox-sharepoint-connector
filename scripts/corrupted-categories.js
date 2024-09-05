/**
 * Quick script to find prompts in the Demo tenant that are related to categories that
 * not belong to the tenant. This happened after migrating to Auth0.
 */

import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";

dotenv.config({ path: [".env.local", ".env"] });

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid environment variable: "MONGODB_URI"');
}

const options = {};
const mongo = new MongoClient(process.env.MONGODB_URI, options);
const db = mongo.db(process.env.MONGODB_DATABASE);

// Demo tenant
const id = new ObjectId("66cc50d98103241cf3354d3f");

const prompts = await db
  .collection("prompts")
  .find({ tenant_id: id })
  .toArray();
const categories = await db.collection("categories").find().toArray();

const groups = categories.reduce((groupsAcc, category) => {
  if (category.groups) {
    return [...groupsAcc, ...category.groups];
  }
  return groupsAcc;
}, []);

const corrupted = prompts
  .map((prompt) => {
    const category = categories.find(
      (category) => category._id.toString() === prompt.category.toString(),
    );

    if (category.tenant_id.toString() !== id.toString()) {
      const group = groups.find(
        (group) => group._id.toString() === prompt.group.toString(),
      );

      return {
        prompt_id: prompt._id,
        prompt_title: prompt.title,
        category_id: category._id,
        category_title: category.title,
        group_id: group?._id,
        group_title: group?.title,
      };
    }

    return null;
  })
  .filter(Boolean);

console.log(corrupted);
