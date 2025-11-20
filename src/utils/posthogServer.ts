
import { POSTHOG_API_HOST } from '$types/Posthog'
import type { ObjectId } from 'mongodb';
import { PostHog, type EventMessage, type IdentifyMessage } from 'posthog-node'

let serverInstance: PostHog;

/**
 * This is PostHog instance, capture for CLIENT Side 
 * 
 * Important Note: DO NOT export `serverInstance` to controll for specific tenant (exlucde all Posthog script + init when Tenant setting Off)
 * 
 * EX: `export default serverInstance`  ==> cause load during import 
*/
export function getPosthogServerInstance() {
    if (serverInstance) {
        return serverInstance;
    }
    serverInstance = new PostHog(import.meta.env.PUBLIC_POSTHOG_KEY, {
        host: POSTHOG_API_HOST
    })
    return serverInstance;
}

/**
   * Captures an event with optional properties
   *
   * @example
   * ```ts
   * posthogServerCapture(tenant, {
   *   distinctId: userId?.toString(),
   *   event: EventName.AiboxLogin,
   *   properties: {
   *    username: auth0User.data.nickname,
   *    name: auth0User.data.name,
   *    email: auth0User.data.email,
   *    tenant_id: tenant._id.toString(),
   *   }
   * })
   * ```
   *
   * @param tenant Check tenant.is_on_posthog to decide identify or not
   * @param props {@link EventMessage}
   * @returns 
*/
export function posthogServerCapture(tenant: { is_on_posthog?: boolean, _id: ObjectId | string, name: string } | null | undefined, props: EventMessage) {
    if (!tenant || !tenant.is_on_posthog) {
        return;
    }
    const newProperties = {
        tenant_id: tenant._id?.toString() || "-",
        tenant_name: tenant.name?.toString() || "-", ...props
    }
    console.log("posthogServerCapture", newProperties)
    getPosthogServerInstance?.()?.capture(newProperties)
}

/**
   * Captures an event with optional properties without tenant check
   *
   * @example
   * ```ts
   * posthogServerCaptureWithoutTenant({
   *   distinctId: userId?.toString(),
   *   event: EventName.OnboardingStep1,
   *   properties: {
   *    page_name: auth0User.data.nickname,
   *   }
   * })
   * ```
   *
   * @param props {@link EventMessage}
   * @returns 
*/
export function posthogServerCaptureWithoutTenant(props: EventMessage) {
    console.log("posthogServerCaptureWithoutTenant", props)
    getPosthogServerInstance?.()?.capture(props)
}

/**
   * Identify a user and set their properties.
   *
   * @example
   * ```ts
   * posthogServerIdentify(tenant, {
   *   distinctId: userId?.toString(),
   *   properties: {
   *     username: auth0User.data.nickname,
   *     name: auth0User.data.name,
   *     email: auth0User.data.email,
   *     tenant_id: tenant._id.toString(),
   *   }
   * })
   * ```
   *
   * @param tenant Check tenant.is_on_posthog to decide identify or not
   * @param props {@link IdentifyMessage}
   * @returns 
*/
export function posthogServerIdentify(tenant: { is_on_posthog?: boolean, _id: ObjectId | string, name: string } | null | undefined, props: IdentifyMessage) {
    if (!tenant || !tenant.is_on_posthog) {
        return;
    }
    const newProperties = {
        tenant_id: tenant._id?.toString() || "-",
        tenant_name: tenant.name?.toString() || "-", ...props
    }
    console.log("posthogServerIdentify", newProperties)
    getPosthogServerInstance?.()?.identify(newProperties)
}

