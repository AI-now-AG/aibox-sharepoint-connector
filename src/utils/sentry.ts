import * as Sentry from "@sentry/astro";

export const sendExceptionToSentry = (
  error: unknown,
  additionalContext?: Record<string, unknown>,
) => {
  Sentry.captureException(error, additionalContext);
  console.log("Error sent to Sentry:", error, additionalContext);
  throw error;
};

/**
 * Capture an exception in Sentry without rethrowing.
 * Use this for best-effort / non-blocking error reporting.
 */
export const captureException = (
  error: unknown,
  additionalContext?: Record<string, unknown>,
) => {
  Sentry.captureException(error, { extra: additionalContext });
  console.log("Error captured in Sentry:", error, additionalContext);
};
