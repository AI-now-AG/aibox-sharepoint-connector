import { EventName as AiboxEventName, POSTHOG_API_HOST } from '$types/Posthog'
import posthogClient, { type CaptureOptions, type EventName, type Properties } from 'posthog-js'

export function posthogClientCapture(tenant: { is_on_posthog?: boolean } | null | undefined, event_name: AiboxEventName | EventName, properties?: Properties | null, options?: CaptureOptions) {
    if (!tenant || !tenant.is_on_posthog) {
        return;
    }
    if (typeof window !== 'undefined') {
        posthogClient.init(import.meta.env.PUBLIC_POSTHOG_KEY, {
            api_host: POSTHOG_API_HOST,
        })
    }
    posthogClient.capture(event_name, properties, options);
}

export default posthogClient
