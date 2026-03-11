import { auth } from "./auth";
import { tenant } from "./tenant";
import { category } from "./category";
import { prompt } from "./prompt";
import { transcription } from "./transcription";
import { user } from "./user";
import { knowledgeBase } from "./knowledgeBase2";
import { conversation } from "./conversation";
import { onboarding } from "./onboarding";
import { report } from "./report";
import { configurations } from "./configuration";
import { tenantCreation } from "./tenantCreation";
import { globalCategory } from "./globalCategory";
import { globalPrompt } from "./globalPrompt";
import { posthog } from "./posthog";
import { ragConfiguration } from "./ragConfiguration";
import { globalApiKeys } from "./globalApiKeys";

export const server = {
  tenant,
  category,
  prompt,
  transcription,
  auth,
  user,
  knowledgeBase,
  conversation,
  onboarding,
  report,
  configurations,
  tenantCreation,
  globalCategory,
  globalPrompt,
  posthog,
  ragConfiguration,
  globalApiKeys,
};
