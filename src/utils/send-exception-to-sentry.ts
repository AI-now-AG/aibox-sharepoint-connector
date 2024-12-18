import * as Sentry from "@sentry/astro";
import log from "./log";

export const sendExceptionToSentry = (
  error: unknown,
  additionalContext?: Record<string, any>,
) => {
  Sentry.captureException(error, additionalContext);
  log.e(error, JSON.stringify(additionalContext));
  throw error;
};
