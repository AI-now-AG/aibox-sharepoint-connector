import puppeteer from "puppeteer";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
    const { html, filename } = await request.json();

    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer: any = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
            top: "20mm",
            right: "15mm",
            bottom: "20mm",
            left: "15mm",
        },
    });

    await browser.close();

    return new Response(pdfBuffer, {
        headers: {
            "Content-Type": "application/pdf",
            'Content-Disposition': `attachment; filename="${filename}"`,
        },
    });
};
