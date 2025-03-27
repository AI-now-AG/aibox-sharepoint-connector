import { auth } from "./auth";
import { tenant } from "./tenant";
import { category } from "./category";
import { prompt } from "./prompt";
import { transcription_settings } from "./transcription_settings";
import { transcription } from "./transcription";
import { user } from "./user";
import { perplexity } from "./perplexity";
import { knowledgebase } from "./knowledgebase";
import { usage } from "./usage";

export const server = {
  tenant,
  category,
  prompt,
  transcription_settings,
  transcription,
  auth,
  user,
  perplexity,
  knowledgebase,
  usage,
};
