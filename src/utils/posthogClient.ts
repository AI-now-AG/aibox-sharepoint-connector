import posthogClient from 'posthog-js'

declare global {
    interface Window {
        posthog?: any
    }
}

if (typeof window !== 'undefined' && !window.posthog) {
    posthogClient.init(import.meta.env.PUBLIC_POSTHOG_KEY, {
        api_host: 'https://eu.i.posthog.com',
    })
}

export default posthogClient