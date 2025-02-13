import { z } from "zod";
import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import { FileFormat } from "$types/TranscribeRequest";
import { client } from "$data/mongodb";

const MONGO_URI = process.env.MONGODB_URI || "";
const DB_NAME = process.env.MONGODB_DATABASE;

export enum BatchStatus {
  Failed = "Failed",
  NotStarted = "NotStarted",
  Running = "Running",
  Succeeded = "Succeeded",
}

export const BatchSchema = z.object({
  name: z.string(),
  status: z
    .enum([
      BatchStatus.Failed,
      BatchStatus.NotStarted,
      BatchStatus.Running,
      BatchStatus.Succeeded,
    ])
    .optional(),
  taskUrl: z.string().optional(),
  destUrl: z.string().optional(),
  diarizationEnabled: z.boolean().optional(),
  maxSpeakers: z.number().optional(),
  error: z.string().optional(),
  report: z.record(z.any()).optional(),
});

const TaskSchema = z.object({
  taskId: z.string(),
  tenant_id: z.instanceof(ObjectId).optional(),
  creator_id: z.instanceof(ObjectId).optional(),
  audio_url: z.string().optional(),
  output_url: z.string().optional(),
  status: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  error: z.string().optional(),
  txtUrl: z.string().optional(),
  srtUrl: z.string().optional(),
  assUrl: z.string().optional(),
  selectedFileFormat: z.array(z.nativeEnum(FileFormat)).optional(),
});

export const TaskBatchSchema = TaskSchema.extend({
  batchUpdate: z.array(BatchSchema).optional(),
});

export type Task = z.infer<typeof TaskBatchSchema>;
export type BatchTask = z.infer<typeof BatchSchema>;
let db: Db | null = null;

const connectToDb = async () => {
  if (!db) {
    try {
      const client = new MongoClient(MONGO_URI);
      await client.connect();
      db = client.db(DB_NAME);
    } catch (err) {
      console.error("Error connecting to MongoDB:", err);
      throw err;
    }
  }
  return db;
};

const getTasksCollection = async (): Promise<Collection> => {
  const db = await connectToDb();
  return db.collection("transcription_status");
};

const ensureIndexes = async () => {
  const collection = await getTasksCollection();
  await collection.createIndex({ taskId: 1 }, { unique: true });
};

export const createTask = async (taskId: string, taskData: Partial<Task>) => {
  const parsedData = TaskBatchSchema.parse({ taskId, ...taskData });
  const collection = await getTasksCollection();
  const existingTaskData = await collection.findOne({ taskId });
  if (existingTaskData) {
    await collection.deleteOne({ taskId });
  }
  await collection.insertOne({
    ...parsedData,
    createdAt: new Date().toISOString(),
  });
};

// export const updateTask = async (taskId: string, updates: Partial<Task>) => {
//   const parsedUpdates = TaskBatchSchema.partial().parse(updates);
//   const collection = await getTasksCollection();
//   await collection.updateOne(
//     { taskId },
//     { $set: { ...parsedUpdates, updatedAt: new Date().toISOString() } },
//   );
// };

export const updateTask = async (
  taskId: string,
  updates: Partial<Task>,
  batchUpdateItem?: Partial<BatchTask>,
) => {
  const parsedUpdates = TaskBatchSchema.partial().parse(updates);

  // Parse batchUpdateItem if provided
  const parsedBatchUpdateItem = batchUpdateItem
    ? BatchSchema.parse(batchUpdateItem)
    : null;

  const updateQuery: Record<string, unknown> = {
    $set: { ...parsedUpdates, updatedAt: new Date().toISOString() },
  };

  // Add $push operation for batchUpdate if batchUpdateItem is provided
  if (parsedBatchUpdateItem) {
    updateQuery.$push = { batchUpdate: parsedBatchUpdateItem };
  }
  const collection = await getTasksCollection();
  await collection.updateOne({ taskId }, updateQuery);
};

export const getTask = async (taskId: string): Promise<Task | null> => {
  const collection = await getTasksCollection();
  const taskData = await collection.findOne({ taskId });
  return taskData ? TaskBatchSchema.parse(taskData) : null;
};

export function getCurrentBatchStatus(batchUpdate: BatchTask[] = []) {
  return {
    running: batchUpdate.some((batch) => batch.status === BatchStatus.Running),
    succeeded: batchUpdate.some(
      (batch) => batch.status === BatchStatus.Succeeded,
    ),
    failed: batchUpdate.some((batch) => batch.status === BatchStatus.Failed),
    notStarted: batchUpdate.some(
      (batch) => batch.status === BatchStatus.NotStarted,
    ),
  };
}

ensureIndexes().catch((err) => {
  console.error("Error ensuring MongoDB indexes:", err);
});
