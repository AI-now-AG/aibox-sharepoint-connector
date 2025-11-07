
import { POSTHOG_API_HOST } from '$types/Posthog'
import { PostHog, type EventMessage, type IdentifyMessage } from 'posthog-node'

const posthogServer = new PostHog(import.meta.env.PUBLIC_POSTHOG_KEY, {
    host: POSTHOG_API_HOST
})

export function posthogServerCapture(tenant: { is_on_posthog?: boolean } | null | undefined, props: EventMessage) {
    if (!tenant || !tenant.is_on_posthog) {
        return;
    }
    posthogServer.capture(props)
}

export function posthogServerIdentify(tenant: { is_on_posthog?: boolean } | null | undefined, props: IdentifyMessage) {
    if (!tenant || !tenant.is_on_posthog) {
        return;
    }
    posthogServer.identify(props)
}

export default posthogServer