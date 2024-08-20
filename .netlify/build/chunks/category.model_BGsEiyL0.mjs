import { ObjectId } from 'mongodb';
import { d as db } from './mongodb_BtEbS6qU.mjs';
import { z } from 'zod';

const GroupSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  title: z.string(),
  slug: z.string().optional()
});
const CategorySchema = z.object({
  tenant_id: z.instanceof(ObjectId).optional(),
  creator_id: z.instanceof(ObjectId).optional(),
  title: z.string(),
  slug: z.string(),
  icon: z.string().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional()
});
const CategoryGroupSchema = CategorySchema.extend({
  groups: z.array(GroupSchema)
});
const collection = db.collection("categories");
const convertGroupObjectIdToString = (group) => {
  return {
    ...group,
    _id: group._id?.toString()
  };
};
const convertObjectIdToString = (category) => {
  return {
    ...category,
    tenant_id: category.tenant_id?.toString(),
    creator_id: category.creator_id?.toString(),
    groups: category.groups.map(convertGroupObjectIdToString)
  };
};
const CategoryModel = {
  add: async (category) => {
    const validated = CategoryGroupSchema.parse(category);
    return collection.insertOne(validated);
  },
  remove: async (id) => {
    const _id = new ObjectId(id);
    return collection.deleteOne({ _id });
  },
  upsert: async (category) => {
    const validated = CategoryGroupSchema.parse(category);
    return collection.updateOne(
      { title: validated.title },
      { $set: validated },
      {
        upsert: true
      }
    );
  },
  list: async () => collection.find({}).sort({ created_at: 1 }).sort({ created_at: 1 }),
  listByUser: async (id) => {
    const _id = new ObjectId(id);
    return collection.find({ creator_id: _id }).sort({ created_at: 1 });
  },
  get: async (id) => {
    const _id = new ObjectId(id);
    const doc = await collection.findOne({ _id });
    if (!doc) return null;
    return convertObjectIdToString(doc);
  },
  getByTitle: async (title) => {
    return collection.findOne({ title });
  },
  getBySlug: async (slug) => {
    return collection.findOne({ slug });
  },
  update: async (id, updatedInstruction) => {
    const _id = new ObjectId(id);
    const validated = CategoryGroupSchema.partial().parse(updatedInstruction);
    const result = await collection.updateOne(
      { _id },
      { $set: { ...validated } }
    );
    return result;
  }
};

export { CategoryModel as C };
