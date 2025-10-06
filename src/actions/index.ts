import { auth } from "./auth";
import { tenant } from "./tenant";
import { category } from "./category";
import { prompt } from "./prompt";
import { transcription_settings } from "./transcription_settings";
import { transcription } from "./transcription";
import { user } from "./user";
import { knowledgebase } from "./knowledgebase";
import { conversation } from "./conversation";
import { onboarding } from "./onboarding";
import { report } from "./report";
import { configurations } from "./configuration";

export const server = {
  tenant,
  category,
  prompt,
  transcription_settings,
  transcription,
  auth,
  user,
  knowledgebase,
  conversation,
  onboarding,
  report,
  configurations,
};
