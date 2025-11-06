import { defineAction } from "astro:actions";
import posthogServer from "$utils/posthogServer";
import type { EventMessage } from "$types/Posthog";

export const posthog = {
  capture: defineAction({
    handler: async (input: EventMessage, _context): Promise<any> => {
      try {
        posthogServer.capture(input)
        console.log(" posthogServer.capture", input)
        return { success: true };
      } catch (error) {
        console.error(error, "Failed to capture Posthog event");
        throw error;
      }
    },
  })
};
