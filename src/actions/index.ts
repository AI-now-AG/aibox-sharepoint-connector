import { auth } from "./auth";
import { tenant } from "./tenant";
import { category } from "./category";
import { transcription_settings } from "./transcription_settings";

export const server = {
  tenant,
  category,
  transcription_settings,
  auth,
};
