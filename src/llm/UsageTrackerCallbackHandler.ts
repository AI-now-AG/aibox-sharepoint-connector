import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { LLMResult } from "@langchain/core/outputs";
import type { Serialized } from "@langchain/core/load/serializable";
import { ObjectId } from "mongodb";
import { ApiKeyProvider } from "$types/TenantFeature";
import { UsageType } from "$types/UsageTracking";
import UsageModel, { type Usage } from "$data/models/usage.model";

export class UsageTrackerCallbackHandler extends BaseCallbackHandler {
  name = "usage_tracker_callback_handler";

  private tenantId: ObjectId | undefined;
  private provider: ApiKeyProvider | undefined;
  private model: string | undefined;
  private type: UsageType | undefined;

  constructor(
    tenantId: ObjectId | string,
    provider: ApiKeyProvider,
    model: string,
    type: UsageType,
  ) {
    super();

    (async () => {
      this.tenantId =
        tenantId instanceof ObjectId ? tenantId : new ObjectId(tenantId);
      this.provider = provider;
      this.model = model;
      this.type = type;
    })();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handleLLMStart(llm: Serialized, prompts: string[], runId: string) {
    // console.log("🟡 LLM START");
    // console.log("Model:", llm.name);
    // console.log("Prompts:", prompts);
    // console.log("Run ID:", runId);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handleLLMEnd(output: LLMResult, runId: string) {
    console.log("🟢 LLM END");
    console.log("Output:", JSON.stringify(output.generations));
    console.log("Token Usage:", output.llmOutput?.tokenUsage);

    const respone = JSON.parse(JSON.stringify(output.generations));
    const usage: Partial<Omit<Usage, "_id">> = {
      tenant_id: this.tenantId,
      provider: this.provider,
      model: this.model,
      type: this.type,
      input_tokens: output.llmOutput?.tokenUsage?.promptTokens ?? 0,
      output_tokens: output.llmOutput?.tokenUsage?.completionTokens ?? 0,
      metadata: {
        cached_tokens:
          respone?.[0]?.[0]?.message?.kwargs?.response_metadata?.usage
            ?.prompt_tokens_details?.cached_tokens || 0,
      },
    };

    await UsageModel.create(usage);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  async handleLLMError(error: any, runId: string) {
    //console.error("🔴 LLM ERROR:", error);
    //console.error("Run ID:", runId);
  }
}
