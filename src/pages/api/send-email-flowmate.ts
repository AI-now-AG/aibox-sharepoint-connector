import type { APIRoute } from "astro";
import { cached } from "$utils/cache";

const OIH_BASE = "https://api.platform.openintegrationhub.com";
const OIH_ADMIN_TOKEN =
    "gjECis74Yf_o6cBjVfteQ2pIFBDXCHVLcgFphFUs46k8ejdjPRI-KqpLyWR8dpbIpJZD-ogVSyYbZVJ7FrYMmBH8OvXqNsiLrxZx8-_fBoHSuUbpkNVB39fz19EG4xzxCwy4iNfTl6T9vpE_aoF8fjskFhl-Lk0LHMeJaWC0k9w";

async function getFlowmateFlowId(userEmail: string): Promise<string> {
    // Cache per user so each user always sends from their own Gmail flow
    return cached(`${userEmail}:flowmate:email-flow-id`, 30 * 60, async () => {
        // Step 1: Get OIH internal user _id by aibox email
        const usersRes = await fetch(
            `${OIH_BASE}/users?username=${encodeURIComponent(userEmail)}`,
            { headers: { Authorization: `Bearer ${OIH_ADMIN_TOKEN}` } },
        );
        if (!usersRes.ok) throw new Error("Failed to fetch Flowmate user");

        const users = await usersRes.json();
        const oihUserId = Array.isArray(users) ? users[0]?._id : users._id;

        // Step 2: If the user has their own flow, use it
        // Note: combining filter[user] + filter[status] is unreliable in Flowmate API,
        // so we fetch all user flows and take the first one regardless of reported status
        if (oihUserId) {
            const userFlowsRes = await fetch(
                `${OIH_BASE}/flows?filter%5Buser%5D=${oihUserId}`,
                { headers: { Authorization: `Bearer ${OIH_ADMIN_TOKEN}` } },
            );
            if (userFlowsRes.ok) {
                const userFlowsData = await userFlowsRes.json();
                const userFlows: { id: string }[] = userFlowsData.data ?? [];
                if (userFlows.length > 0) {
                    return userFlows[0].id;
                }
            }
        }

        // Step 3: Fallback — use first active Gmail flow in the tenant
        const fallbackRes = await fetch(
            `${OIH_BASE}/flows?filter%5Bstatus%5D=active`,
            { headers: { Authorization: `Bearer ${OIH_ADMIN_TOKEN}` } },
        );
        if (!fallbackRes.ok) throw new Error("Failed to fetch Flowmate flows");

        const fallbackData = await fallbackRes.json();
        const allFlows: { id: string; description?: string }[] = fallbackData.data ?? [];
        const emailFlow =
            allFlows.find((f) =>
                f.description?.toLowerCase().includes("google") ||
                f.description?.toLowerCase().includes("gmail"),
            ) ?? allFlows[0];

        if (!emailFlow) {
            throw new Error(
                "No active Gmail flow found. Please activate Gmail in the Flowmate Integration Center first.",
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

        const userEmail = locals.user?.email ?? "noreply@aibox-app.ch";

        // Resolve flow ID for this user (per-user, with tenant fallback)
        const flowId = await getFlowmateFlowId(userEmail);

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
                sender: userEmail,
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
