import posthogClient from 'posthog-js'

if (typeof window !== 'undefined') {
    posthogClient.init(import.meta.env.PUBLIC_POSTHOG_KEY, {
        api_host: 'https://eu.i.posthog.com'
    })
}

export default posthogClient
