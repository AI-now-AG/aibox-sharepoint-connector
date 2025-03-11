import { auth } from "./auth";
import { tenant } from "./tenant";
import { category } from "./category";
import { prompt } from "./prompt";
import { transcription_settings } from "./transcription_settings";
import { user } from "./user";
import { perplexity } from "./perplexity";
import { knowledgebase } from "./knowledgebase";

export const server = {
  tenant,
  category,
  prompt,
  transcription_settings,
  auth,
  user,
  perplexity,
  knowledgebase,
};
