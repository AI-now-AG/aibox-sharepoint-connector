import { z } from "zod";
import { MongoClient, Db, Collection } from "mongodb";

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DATABASE;

const TaskSchema = z.object({
  taskId: z.string(),
  status: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  error: z.string().optional(),
  txtUrl: z.string().optional(),
  srtUrl: z.string().optional(),
});


type Task = z.infer<typeof TaskSchema>;
let db: Db | null = null;

const connectToDb = async () => {
  if (!db) {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db(DB_NAME);
  }
  return db;
};

const getTasksCollection = async (): Promise<Collection> => {
  const db = await connectToDb();
  return db.collection("transcriptionStatus");
};

const ensureIndexes = async () => {
  const collection = await getTasksCollection();
  await collection.createIndex({ taskId: 1 }, { unique: true });
};

export const createTask = async (taskId: string, taskData: Partial<Task>) => {
  const parsedData = TaskSchema.parse({ taskId, ...taskData });
  const collection = await getTasksCollection();
  await collection.insertOne({ ...parsedData, createdAt: new Date().toISOString() });
};

export const updateTask = async (taskId: string, updates: Partial<Task>) => {
  const parsedUpdates = TaskSchema.partial().parse(updates);
  const collection = await getTasksCollection();
  await collection.updateOne(
    { taskId },
    { $set: { ...parsedUpdates, updatedAt: new Date().toISOString() } }
  );
};

export const getTask = async (taskId: string): Promise<Task | null> => {
  const collection = await getTasksCollection();
  const taskData = await collection.findOne({ taskId });
  return taskData ? TaskSchema.parse(taskData) : null;
};

ensureIndexes().catch((err) => {
  console.error("Error ensuring MongoDB indexes:", err);
});
