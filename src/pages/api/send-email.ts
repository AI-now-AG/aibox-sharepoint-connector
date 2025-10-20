import type { APIRoute } from "astro";
import sendMail from "$utils/mail";

export const POST: APIRoute = async ({ request }) => {
    try {
        const { fromName, to, subject, html } = await request.json();

        if (!to || !subject || !html) {
            return new Response(
                JSON.stringify({ error: "Missing required fields: to, subject, html" }),
                { status: 400 }
            );
        }

        const msg = {
            from: {
                name: fromName ?? "AI now AG",
                email: "no-reply@aibox-app.ch",
            },
            to,
            subject,
            html,
        };

        await sendMail(msg);

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        console.error("❌ SendGrid Error:", err);

        return new Response(
            JSON.stringify({
                error: "Failed to send email",
                details: err.message || err.toString(),
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};
