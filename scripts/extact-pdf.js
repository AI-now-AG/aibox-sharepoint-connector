import fs from "fs";
import PDFParser from "pdf2json";

async function convertPdfToHtml(pdfPath) {
  return new Promise((resolve, reject) => {
    let pdfParser = new PDFParser();
    pdfParser.loadPDF(pdfPath);

    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      let html = "<div>";
      let lastY = -1;
      let paragraph = "";

      pdfData.Pages.forEach((page) => {
        page.Texts.forEach((text) => {
          let content = decodeURIComponent(text.R[0].T);
          let posY = text.y;
          let fontSize = text.R[0].TS[1]; // Extract font size
          let lineBreakThreshold = fontSize * 0.5; // Dynamic threshold

          let isBold = text.R[0].TS[2] > 400;
          let isItalic = text.R[0].TS[3] === 1;

          if (isBold) content = `<b>${content}</b>`;
          if (isItalic) content = `<i>${content}</i>`;

          // **Improved Line Break Detection**
          if (lastY !== -1 && Math.abs(posY - lastY) > lineBreakThreshold) {
            html += `<p>${paragraph.trim()}</p>`;
            paragraph = "";
          }

          paragraph += content + " ";
          lastY = posY;
        });

        if (paragraph.trim()) {
          html += `<p>${paragraph.trim()}</p>`;
          paragraph = ""; // Reset paragraph after each page
        }
      });

      html += "</div>";
      resolve(html);
    });

    pdfParser.on("pdfParser_dataError", (err) => reject(err));
  });
}

// Example Usage
convertPdfToHtml("./scripts/sample.pdf").then((html) => {
  fs.writeFileSync("./scripts/output-pdf.html", html);
  console.log("PDF converted to HTML with formatting!");
});
