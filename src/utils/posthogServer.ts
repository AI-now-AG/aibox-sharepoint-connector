
import { POSTHOG_API_HOST } from '$types/Posthog'
import { PostHog } from 'posthog-node'

const posthogServer = new PostHog(import.meta.env.PUBLIC_POSTHOG_KEY, {
    host: POSTHOG_API_HOST
})

export default posthogServer