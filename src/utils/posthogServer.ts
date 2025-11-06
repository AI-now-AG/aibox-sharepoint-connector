
import { PUBLIC_POSTHOG_KEY } from '$types/Posthog'
import { PostHog } from 'posthog-node'

const posthogServer = new PostHog(PUBLIC_POSTHOG_KEY, {
    host: 'https://eu.i.posthog.com'
})

export default posthogServer