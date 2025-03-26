import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { LLMResult } from "@langchain/core/outputs";
import type { Serialized } from "@langchain/core/load/serializable";
import { ObjectId } from "mongodb";
import { ApiKeyProvider } from "$types/TenantFeature";
import UsageModel, { type Usage } from "$data/models/usage.model";

export class UsageTrackerCallbackHandler extends BaseCallbackHandler {
  name = "usage_tracker_callback_handler";

  private tenantId: ObjectId | undefined;
  private provider: ApiKeyProvider | undefined;
  private model: string | undefined;

  constructor(
    tenantId: ObjectId | string,
    provider: ApiKeyProvider,
    model: string,
  ) {
    super();

    (async () => {
      this.tenantId =
        tenantId instanceof ObjectId ? tenantId : new ObjectId(tenantId);
      this.provider = provider;
      this.model = model;
    })();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handleLLMStart(llm: Serialized, prompts: string[], runId: string) {
    // console.log("🟡 LLM START");
    // console.log("Model:", llm.name);
    // console.log("Prompts:", prompts);
    // console.log("Run ID:", runId);
  }

  async handleLLMEnd(output: LLMResult, runId: string) {
    console.log("🟢 LLM END");
    console.log("Output:", output.generations?.[0]?.[0]?.text);
    console.log("Token Usage:", output.llmOutput?.tokenUsage);
    console.log("Run ID:", runId);

    const usage: Partial<Omit<Usage, "_id">> = {
      tenant_id: this.tenantId,
      provider: this.provider,
      model: this.model,
      input_tokens: output.llmOutput?.tokenUsage?.promptTokens,
      output_tokens: output.llmOutput?.tokenUsage?.completionTokens,
    };
    await UsageModel.create(usage);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  async handleLLMError(error: any, runId: string) {
    //console.error("🔴 LLM ERROR:", error);
    //console.error("Run ID:", runId);
  }
}
