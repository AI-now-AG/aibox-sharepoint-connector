import TenantModel, { type Tenant } from "$data/models/tenant.model";
import UserModel, { type User } from "$data/models/user.model";
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { BaseMessage } from "@langchain/core/messages";
import type { LLMResult } from "@langchain/core/outputs";
import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import type { Serialized } from "node_modules/@langchain/core/dist/load/serializable";
import UsageLogModel, { type UsageLog } from "$data/models/usageLog.model";
import type { ApiKeyProvider } from "$types/TenantFeature";
import { UsageType } from "$types/UsageTracking";

const MONGO_URI = process.env.MONGODB_URI || "";
const DB_NAME = process.env.MONGODB_DATABASE;

let db: Db | null = null;
const connectToDb = async () => {
  if (!db) {
    try {
      const client = new MongoClient(MONGO_URI);
      await client.connect();
      db = client.db(DB_NAME);
      await createTTLIndex();
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

const createTTLIndex = async () => {
  const collection = await getLogsCollection();
  await collection.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });
};

export class LoggingCallbackHandler extends BaseCallbackHandler {
  name = "logging_callback_handler";

  private tenant: Tenant | null = null;
  private user: User | null = null;

  constructor(
    private tenantId: string,
    private userId: string,
    private filename: string,
    private provider: ApiKeyProvider,
    private model: string,
  ) {
    super();
    this.initialize();
  }

  private async initialize() {
    this.tenant = await TenantModel.get(this.tenantId);
    this.user = await UserModel.get(this.userId);
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
    this.tenant = await TenantModel.get(this.tenantId);
    this.user = await UserModel.get(this.userId);
    const collection = await getLogsCollection();
    await collection.insertOne({
      tenant_id: new ObjectId(this.tenantId),
      tenant_name: this.tenant?.name,
      creator_id: new ObjectId(this.userId),
      creator_name: this.user?.name,
      filename: this.filename,
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
      expireAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  }

  async handleChatModelStart(
    llm: Serialized,
    messages: BaseMessage[][],
    runId: string,
    parentRunId?: string,
    extraParams?: Record<string, unknown>,
    tags?: string[],
    metadata?: Record<string, unknown>,
    runName?: string,
  ) {
    this.tenant = await TenantModel.get(this.tenantId);
    this.user = await UserModel.get(this.userId);
    const collection = await getLogsCollection();
    await collection.insertOne({
      tenant_id: new ObjectId(this.tenantId),
      tenant_name: this.tenant?.name,
      creator_id: new ObjectId(this.userId),
      creator_name: this.user?.name,
      filename: this.filename,
      type: "userchat",
      model: llm.name,
      messages,
      runId,
      parentRunId,
      extraParams,
      tags,
      metadata,
      runName,
      timestamp: new Date(),
      expireAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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
      tenant_name: this.tenant?.name,
      creator_id: new ObjectId(this.userId),
      creator_name: this.user?.name,
      filename: this.filename,
      type: "assistant",
      response: output.generations,
      runId,
      parentRunId,
      tags,
      timestamp: new Date(),
      expireAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const respone = JSON.parse(JSON.stringify(output.generations));
    const usage: Partial<UsageLog> = {
      tenant_id: new ObjectId(this.tenantId),
      provider: this.provider,
      model: this.model,
      type: UsageType.Text,
      input_tokens: output.llmOutput?.tokenUsage?.promptTokens ?? 0,
      output_tokens: output.llmOutput?.tokenUsage?.completionTokens ?? 0,
      metadata: {
        cached_tokens:
          respone?.[0]?.[0]?.message?.kwargs?.response_metadata?.usage
            ?.prompt_tokens_details?.cached_tokens || 0,
      },
    };

    await UsageLogModel.create(usage);
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
      tenant_name: this.tenant?.name,
      creator_id: new ObjectId(this.userId),
      creator_name: this.user?.name,
      type: "error",
      error: err.message,
      runId,
      parentRunId,
      tags,
      timestamp: new Date(),
      expireAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  }
}
