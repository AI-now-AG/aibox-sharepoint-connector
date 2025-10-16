import type { APIRoute } from "astro";
import sendMail from "$utils/mail";

export const POST: APIRoute = async ({ request }) => {
    try {
        const { to, subject, html } = await request.json();

        if (!to || !subject || !html) {
            return new Response(
                JSON.stringify({ error: "Missing required fields: to, subject, html" }),
                { status: 400 }
            );
        }

        const msg = {
            from: {
                name: "AI now AG",
                email: "no-reply@ainow.ch",
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
