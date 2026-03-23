import { EventName as AiboxEventName, POSTHOG_API_HOST } from "$types/Posthog";
import type { ObjectId } from "mongodb";
import posthogClient, {
  PostHog,
  type CaptureOptions,
  type EventName,
  type Properties,
} from "posthog-js";

let clientInstance: PostHog;

/**
 * This is PostHog instance, capture for SERVER Side
 *
 * Important Note: DO NOT export `posthogClient` OR `clientInstance` to controll for specific tenant (exlucde all Posthog script + init when Tenant setting Off)
 *
 * EX: `export default posthogClient` OR `export default clientInstance` ==> cause loading during import
 */
export function getPostHogClientInstance() {
  if (clientInstance) {
    return clientInstance;
  }
  if (typeof window !== "undefined") {
    clientInstance = posthogClient.init(
      import.meta.env.PUBLIC_POSTHOG_KEY ||
        "phc_bJ5bQTIBkxqCtA2BQYlIm1aiVtQ6ybcy7RLTWjH5chd",
      {
        api_host: POSTHOG_API_HOST,
      },
    );
  }
  return clientInstance;
}

/**
 * Captures an event with optional properties
 *
 * @example
 * ```ts
 * posthogClientCapture(tenant, EventName.AiboxPromptResult, {
 *    tenant_id: $tenant?._id?.toString() || "-",
 *    tenant_name: $tenant?.name?.toString() || "-",
 *    use_case: currentPrompt?.title || "-",
 *    tool: selectedPromptTool,
 *    model: getModelName($tenant, currentPrompt?.model),
 *    from: ScreenName.PromptExecutionArea,
 * })
 * ```
 *
 * @param tenant Check tenant.is_on_posthog to decide identify or not
 * @param event_name {@link AiboxEventName}
 * @param properties {@link Properties}
 * @param options {@link CaptureOptions}
 * @returns
 */
export function posthogClientCapture(
  tenant:
    | { is_on_posthog?: boolean; _id: ObjectId | string; name: string }
    | null
    | undefined,
  event_name: AiboxEventName | EventName,
  properties?: Properties | null,
  options?: CaptureOptions,
) {
  if (!tenant || !tenant.is_on_posthog) {
    return;
  }

  const newProperties = {
    tenant_id: tenant._id?.toString() || "-",
    tenant_name: tenant.name?.toString() || "-",
    ...properties,
  };
  console.log("PostHog Client Capture", event_name, newProperties, options);
  getPostHogClientInstance?.()?.capture(event_name, newProperties, options);
}

/**
 * Captures an event with optional properties without tenant check
 *
 * @example
 * ```ts
 * posthogClientCaptureGlobal(EventName.OnboardingStep1, {
 *     page_name: auth0User.data.nickname,
 * })
 * ```
 *
 * @param props {@link EventMessage}
 * @returns
 */
export function posthogClientCaptureGlobal(
  event_name: AiboxEventName | EventName,
  properties: Properties,
  options?: CaptureOptions,
) {
  console.log("PostHog Client Global Capture", event_name, properties, options);
  getPostHogClientInstance?.()?.capture(event_name, properties, options);
}

export function posthogClientCaptureException(
  error: unknown,
  properties: Properties,
) {
  console.log("PostHog Client Capture Exception", error, properties);
  getPostHogClientInstance?.()?.captureException(error, properties);
}
