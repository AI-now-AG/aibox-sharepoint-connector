import type { APIRoute } from "astro";
import { cached } from "$utils/cache";

const OIH_BASE = "https://api.platform.openintegrationhub.com";
const FLOW_CACHE_KEY = "flowmate:email-flow-id";

async function getFlowmateFlowId(adminToken: string): Promise<string> {
    return cached(FLOW_CACHE_KEY, 30 * 60, async () => {
        // Get all active flows for the tenant (shared flow — no per-user filter)
        const flowsRes = await fetch(
            `${OIH_BASE}/flows?filter%5Bstatus%5D=active`,
            { headers: { Authorization: `Bearer ${adminToken}` } },
        );
        if (!flowsRes.ok) throw new Error("Failed to fetch Flowmate flows");

        const flowsData = await flowsRes.json();
        const flows: { id: string; description?: string }[] = flowsData.data ?? [];

        // Find the Gmail/Google email flow by description keyword
        const emailFlow =
            flows.find((f) =>
                f.description?.toLowerCase().includes("google") ||
                f.description?.toLowerCase().includes("gmail"),
            ) ?? flows[0];

        if (!emailFlow) {
            throw new Error(
                "No active Gmail flow found in Flowmate. Please set up the email flow in the Flowmate Integration Center.",
            );
        }

        return emailFlow.id;
    });
}

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const { to, subject, body } = await request.json();

        if (!to || !subject || !body) {
            return new Response(
                JSON.stringify({ error: "Missing required fields: to, subject, body" }),
                { status: 400, headers: { "Content-Type": "application/json" } },
            );
        }

        const adminToken = import.meta.env.FLOWMATE_ADMIN_TOKEN;
        const sender = locals.user?.email ?? "noreply@aibox-app.ch";

        // Resolve shared tenant flow ID (cached 30-min)
        const flowId = await getFlowmateFlowId(adminToken);

        // Send both gateway fields (to/subject/body) AND Gmail step fields
        // (htmlMessage/recipients/sender) — gateway validates the former,
        // Gmail component consumes the latter.
        const res = await fetch(`${OIH_BASE}/webhooks/${flowId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                subject,
                body,
                to,
                htmlMessage: body,
                contentType: "text/html",
                recipients: [to],
                sender,
            }),
        });

        const resData = await res.json().catch(() => ({}));

        // Flowmate returns HTTP 200 even for some errors — check message field
        if (!res.ok || resData.message) {
            throw new Error(resData.message || `Flowmate webhook failed with status ${res.status}`);
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err: any) {
        console.error("❌ Flowmate Email Error:", err);
        return new Response(
            JSON.stringify({ error: err.message ?? "Failed to send via Flowmate" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        );
    }
};
