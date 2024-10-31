import { ChatOpenAI, AzureChatOpenAI } from "@langchain/openai";
import type { APIContext } from "astro";
import { decrypt } from "./secure";
import { FeatureName, ApiKeyProvider } from "$data/models/tenant.model";

const initChatOpenAI = (apiKey: string, model: string) => {
  console.log("$utils:chatModel->initChatOpenAI", {
    apiKey,
    model,
  });

  return new ChatOpenAI({
    apiKey,
    model,
  });
};

const initAzureChatOpenAI = (
  azureOpenAIApiKey: string,
  azureOpenAIApiInstanceName: string,
  azureOpenAIApiDeploymentName: string,
  azureOpenAIApiVersion: string,
) => {
  console.log("$utils:chatModel->initAzureChatOpenAI", {
    azureOpenAIApiKey,
    azureOpenAIApiInstanceName,
    azureOpenAIApiDeploymentName,
    azureOpenAIApiVersion,
  });

  return new AzureChatOpenAI({
    azureOpenAIApiKey,
    azureOpenAIApiInstanceName,
    azureOpenAIApiDeploymentName,
    azureOpenAIApiVersion,
  });
};

export const initializeOpenAI = (ctx: APIContext) => {
  const { included_features: features } = ctx.locals.tenant;

  const textPromptsProvider = features?.find(
    (item) => item.name == FeatureName.TextPrommpts,
  );
  const provider = textPromptsProvider
    ? textPromptsProvider.provider
    : ApiKeyProvider.OpenAI;

  // Azure OpenAI
  if (provider == ApiKeyProvider.AzureOpenAI) {
    const azureOpenAIApiKey = decrypt(
      ctx.locals.tenant?.azure_openai_api_key || "",
    );
    const azureOpenAIApiInstanceName =
      ctx.locals.tenant?.azure_openai_instance_name || "";
    const azureOpenAIApiDeploymentName =
      ctx.locals.tenant?.azure_openai_chat_model || "";
    const azureOpenAIApiVersion =
      import.meta.env.AZURE_OPENAI_API_VERSION || "2024-08-01-preview";

    return initAzureChatOpenAI(
      azureOpenAIApiKey,
      azureOpenAIApiInstanceName,
      azureOpenAIApiDeploymentName,
      azureOpenAIApiVersion,
    );
  }

  // OpenAI
  const apiKey = decrypt(ctx.locals.tenant?.openai_api_key || "");
  return initChatOpenAI(apiKey, import.meta.env.OPENAI_MODEL);
};

export default initializeOpenAI;
