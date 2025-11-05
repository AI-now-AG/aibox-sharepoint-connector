
import { PostHog } from 'posthog-node'

const posthog = new PostHog(import.meta.env.PUBLIC_POSTHOG_KEY, {
    host: 'https://eu.i.posthog.com'
})

export default posthog