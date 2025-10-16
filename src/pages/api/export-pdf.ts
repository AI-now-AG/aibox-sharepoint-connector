import puppeteer from "puppeteer";
import puppeteerCore from "puppeteer-core";
import chromium from "chrome-aws-lambda";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
    const { html, filename } = await request.json();

    const browser = await puppeteerCore.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

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
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
};
