import { auth } from "./auth";
import { tenant } from "./tenant";
import { category } from "./category";
import { prompt } from "./prompt";
import { transcription_settings } from "./transcription_settings";

export const server = {
  tenant,
  category,
  prompt,
  transcription_settings,
  auth,
};
