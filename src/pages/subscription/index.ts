import { EventName, ScreenName } from "$types/Posthog";
import { posthogServerCaptureWithoutTenant } from "$utils/posthogServer";
import type { APIContext } from "astro";

export async function GET(context: APIContext): Promise<Response> {
  posthogServerCaptureWithoutTenant({
    distinctId: context.locals.user?.id?.toString() ?? "anonymous",
    event: EventName.AiboxOnboardingStarted,
    properties: {
      page_name: ScreenName.OnboardingStep1,
    },
  });
  return context.redirect("/subscription/step1");
}
