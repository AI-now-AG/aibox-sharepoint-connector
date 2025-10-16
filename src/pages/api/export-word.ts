import type { APIRoute } from "astro";
import convert from 'html-to-docx';

export const POST: APIRoute = async ({ request }) => {
    const { html, filename } = await request.json();
    try {
        const fileBuffer = await convert(html, null, {
            margins: { top: 1440, right: 1800, bottom: 1440, left: 1800 }, // in TWIP (1440 = 1 inch)
        });
        return new Response(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('DOCX conversion failed:', error);
        return new Response('Failed to convert and export document.', { status: 500 });
    }
}