import type { APIRoute } from "astro";
import chromium from "@sparticuz/chromium";

let playwright: any;
if (process.env.NETLIFY || process.env.AWS_REGION) {
    // ✅ Running on Netlify (serverless)
    playwright = await import("playwright-core");
} else {
    // ✅ Running locally
    playwright = await import("playwright");
}

export const POST: APIRoute = async ({ request }) => {
    const { html, filename } = await request.json();

    let browser;

    if (process.env.NETLIFY || process.env.AWS_REGION) {
        // 🧠 Netlify / Lambda-friendly
        browser = await playwright.chromium.launch({
            args: chromium.args,
            executablePath: await chromium.executablePath(),
            headless: true,
        });

    } else {
        // 💻 Local machine with full Chrome
        browser = await playwright.chromium.launch({
            headless: true,
        });
    }

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });

    const pdfBuffer = await page.pdf({
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
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
};

