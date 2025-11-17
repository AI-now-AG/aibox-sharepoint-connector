import { defineAction } from "astro:actions";
import { posthogServerCapture } from "$utils/posthogServer";
import type { EventMessage } from "$types/Posthog";

export const posthog = {
  capture: defineAction({
    handler: async (input: EventMessage, context): Promise<unknown> => {
      try {
        const { tenant } = context.locals;
        posthogServerCapture(tenant, input)
        console.log("posthogServerCapture", input)
        return { success: true };
      } catch (error) {
        console.error(error, "Failed to capture Posthog event");
        throw error;
      }
    },
  })
};
