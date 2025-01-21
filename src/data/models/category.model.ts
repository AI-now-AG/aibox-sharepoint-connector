import { ObjectId } from "mongodb";
import { db, type Document } from "../mongodb";
import { z } from "zod";

export const GroupSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  title: z.string(),
  slug: z.string().optional(),
  active: z.boolean().default(true).optional(),
  position: z.number().default(0).optional(),
});

const CategorySchema = z.object({
  tenant_id: z.instanceof(ObjectId).optional(),
  creator_id: z.instanceof(ObjectId).optional(),
  title: z.string(),
  slug: z.string(),
  icon: z.string().optional(),
  active: z.boolean().default(true).optional(),
  position: z.number().default(0).optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

const CategoryGroupSchema = CategorySchema.extend({
  groups: z.array(GroupSchema),
});

export type Category = z.infer<typeof CategoryGroupSchema>;
export type Group = z.infer<typeof GroupSchema>;

const collection = db.collection("categories");

const convertGroupObjectIdToString = (group: Group) => {
  return {
    ...group,
    _id: group._id?.toString(),
  };
};

// Function to convert ObjectId to string in a Category object
const convertObjectIdToString = (category: Document<Category>) => {
  return {
    ...category,
    tenant_id: category.tenant_id?.toString(),
    creator_id: category.creator_id?.toString(),
    groups: category.groups.map(convertGroupObjectIdToString),
  };
};

export default {
  add: async (category: Category) => {
    const validated = CategoryGroupSchema.parse(category);
    const doc = {
      ...{
        active: true,
        position: 0,
      },
      ...validated,
    };
    return collection.insertOne(doc);
  },

  remove: async (id: string) => {
    const _id = new ObjectId(id);
    return collection.deleteOne({ _id });
  },

  list: async () =>
    collection
      .find<Document<Category>>({})
      .sort({ created_at: 1 })
      .sort({ created_at: 1 }),

  listByTenant: async (tenantId: ObjectId) => {
    return collection
      .find<Document<Category>>({ tenant_id: tenantId })
      .sort({ position: 1, created_at: 1 });
  },

  listActiveByTenant: async (tenantId: ObjectId) => {
    return collection
      .find<Document<Category>>({ tenant_id: tenantId, active: true })
      .sort({ position: 1, created_at: 1 });
  },

  get: async (id: string) => {
    if (!ObjectId.isValid(id)) {
      return Promise.resolve({});
    }
    const _id = new ObjectId(id);
    const doc = await collection.findOne<Document<Category>>({ _id });
    if (!doc) return null;
    return convertObjectIdToString(doc);
  },

  getByTitle: async (title: string) => {
    return collection.findOne<Document<Category>>({ title });
  },

  getByTitleAndTenant: async (title: string, tenantId: ObjectId) => {
    return collection.findOne<Document<Category>>({
      title,
      tenant_id: tenantId,
    });
  },

  getBySlug: async (slug: string) => {
    return collection.findOne<Document<Category>>({ slug });
  },

  getMaxPosition: async (tenantId: ObjectId) => {
    return collection
      .find<Document<Category>>({ tenant_id: tenantId })
      .sort({ position: -1 })
      .limit(1)
      .next();
  },

  update: async (id: string, updatedInstruction: Partial<Category>) => {
    const _id = new ObjectId(id);
    const validated = CategoryGroupSchema.partial().parse(updatedInstruction);
    const result = await collection.updateOne(
      { _id },
      { $set: { ...validated } },
    );
    return result;
  },
};
