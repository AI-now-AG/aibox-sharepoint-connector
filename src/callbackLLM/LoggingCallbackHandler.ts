import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { LLMResult } from "@langchain/core/outputs";
import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import type { Serialized } from "node_modules/@langchain/core/dist/load/serializable";

const MONGO_URI = process.env.MONGODB_URI || "";
const DB_NAME = process.env.MONGODB_DATABASE;

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

const getLogsCollection = async (): Promise<Collection> => {
  const db = await connectToDb();
  return db.collection("llm_logs");
};

export class LoggingCallbackHandler extends BaseCallbackHandler {
  name = "logging_callback_handler";

  constructor(
    private tenantId: string,
    private userId: string,
  ) {
    super();
  }

  async handleLLMStart(
    llm: Serialized,
    prompts: string[],
    runId: string,
    parentRunId?: string,
    extraParams?: Record<string, unknown>,
    tags?: string[],
    metadata?: Record<string, unknown>,
    runName?: string,
  ) {
    const collection = await getLogsCollection();
    await collection.insertOne({
      tenant_id: new ObjectId(this.tenantId),
      creator_id: new ObjectId(this.userId),
      type: "user",
      model: llm.name,
      prompts,
      runId,
      parentRunId,
      extraParams,
      tags,
      metadata,
      runName,
      timestamp: new Date(),
    });
  }

  async handleLLMEnd(
    output: LLMResult,
    runId: string,
    parentRunId?: string,
    tags?: string[],
  ) {
    const collection = await getLogsCollection();
    await collection.insertOne({
      tenant_id: new ObjectId(this.tenantId),
      creator_id: new ObjectId(this.userId),
      type: "system",
      response: output.generations,
      runId,
      parentRunId,
      tags,
      timestamp: new Date(),
    });
  }

  async handleLLMError(
    err: any,
    runId: string,
    parentRunId?: string,
    tags?: string[],
  ) {
    const collection = await getLogsCollection();
    await collection.insertOne({
      tenant_id: new ObjectId(this.tenantId),
      creator_id: new ObjectId(this.userId),
      type: "error",
      error: err.message,
      runId,
      parentRunId,
      tags,
      timestamp: new Date(),
    });
  }
}
