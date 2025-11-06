import { POSTHOG_API_HOST } from '$types/Posthog'
import posthogClient from 'posthog-js'

if (typeof window !== 'undefined') {
    posthogClient.init(import.meta.env.PUBLIC_POSTHOG_KEY, {
        api_host: POSTHOG_API_HOST
    })
}

export default posthogClient
