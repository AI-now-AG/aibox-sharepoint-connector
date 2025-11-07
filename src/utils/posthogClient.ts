import { EventName as AiboxEventName, POSTHOG_API_HOST } from '$types/Posthog'
import posthogClient, { PostHog, type CaptureOptions, type EventName, type Properties } from 'posthog-js'

let clientInstance: PostHog;

/**
 * This is PostHog instance, capture for SERVER Side 
 * 
 * Important Note: DO NOT export `posthogClient` OR `clientInstance` to controll for specific tenant (exlucde all Posthog script + init when Tenant setting Off)
 * 
 * EX: `export default posthogClient` OR `export default clientInstance` ==> cause loading during import 
*/
export function getPosthogClilentInstance() {
    if (clientInstance) {
        return clientInstance;
    }
    if (typeof window !== 'undefined') {
        clientInstance = posthogClient.init(import.meta.env.PUBLIC_POSTHOG_KEY, {
            api_host: POSTHOG_API_HOST,
        })

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
   *    prompt_name: currentPrompt?.title || "-",
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
export function posthogClientCapture(tenant: { is_on_posthog?: boolean } | null | undefined, event_name: AiboxEventName | EventName, properties?: Properties | null, options?: CaptureOptions) {
    if (!tenant || !tenant.is_on_posthog) {
        return;
    }
    console.log("posthogClientCapture", event_name, properties, options)
    getPosthogClilentInstance?.()?.capture(event_name, properties, options);
}