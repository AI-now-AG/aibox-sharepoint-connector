<script lang="ts">
  import * as FileSaver from "file-saver";
  import { Document, Packer, Paragraph, TextRun } from "docx";
  import jsPDF from "jspdf";
  import * as htmlToImage from "html-to-image";

  interface Props {
    filename?: string;
    html?: any;
  }
  const { filename = `prompt-result-${Date.now()}`, html }: Props = $props();

  // --- Export as PDF ---
  async function exportAsPdf() {
    console.log("Exporting as PDF...", html);
    try {
      const wrapper = document.createElement("div");
      wrapper.style.position = "fixed";
      wrapper.style.left = "-9999px";
      wrapper.style.top = "0";
      wrapper.style.opacity = "0";
      wrapper.style.pointerEvents = "none";
      wrapper.style.zIndex = "-9999";

      wrapper.innerHTML = `
      <div id="exportedContainer" style="font-family: Helvetica, sans-serif; font-size: 20px; line-height: 1.6; padding: 32px; width: 800px; background: white;">
        ${html}
      </div>
    `;
      document.body.appendChild(wrapper);

      const container = wrapper.querySelector(
        "#exportedContainer",
      ) as HTMLElement;
      const originalStyle = container.getAttribute("style") || "";
      container.setAttribute(
        "style",
        `${originalStyle}; font-size: 20px; line-height: 1.6; padding: 24px; max-width: 800px;`,
      );

      // Convert to PNG (high-res)
      const dataUrl = await htmlToImage.toPng(container, {
        backgroundColor: "#ffffff",
        cacheBust: true,
        pixelRatio: 3,
        skipFonts: true,
        style: { fontFamily: "Helvetica, sans-serif", fontSize: "16px" },
      });

      document.body.removeChild(wrapper);

      // Prepare PDF
      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;

      const imgProps = pdf.getImageProperties(dataUrl);
      const imgWidth = imgProps.width;
      const imgHeight = imgProps.height;
      const ratio = imgWidth / imgHeight;

      // Calculate scaled image dimensions in PDF units
      const pageWidth = pdfWidth - margin * 2;
      const pageHeight = (pageWidth / ratio) * (imgHeight / imgWidth);
      const fullHeight = (pageWidth / imgWidth) * imgHeight;

      // Convert canvas height to PDF units
      const pxFullHeight = imgHeight;
      const pxPerMm = imgWidth / pageWidth;
      const pageCanvasHeight = pdfHeight * pxPerMm;

      let remainingHeight = pxFullHeight;
      let position = 0;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const image = new Image();
      image.src = dataUrl;
      await image.decode();

      while (remainingHeight > 0) {
        canvas.width = imgWidth;
        canvas.height = Math.min(pageCanvasHeight, remainingHeight);

        ctx.drawImage(
          image,
          0,
          position,
          imgWidth,
          canvas.height,
          0,
          0,
          imgWidth,
          canvas.height,
        );

        const pageData = canvas.toDataURL("image/png");
        const renderHeight = (canvas.height / imgWidth) * pageWidth;

        if (position > 0) pdf.addPage();
        pdf.addImage(pageData, "PNG", margin, margin, pageWidth, renderHeight);

        position += canvas.height;
        remainingHeight -= canvas.height;
      }

      pdf.save(`${filename}.pdf`);
    } catch (err) {
      console.error("Failed to export PDF:", err);
      alert("❌ Failed to export PDF");
    }
  }

  // --- Export as Word ---
  async function exportAsWord() {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun({ text: html, font: "Arial" })],
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    FileSaver.saveAs(blob, `${filename}.docx`);
  }

  // --- Share via Email ---
  function shareByEmail() {
    const subject = encodeURIComponent("Shared AI Prompt Result");
    const body = encodeURIComponent(html);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }
</script>

<button
  onclick={exportAsPdf}
  title="Export as PDF"
  class="p-1 hover:bg-gray-100 rounded"
>
  📄
</button>
<button
  onclick={exportAsWord}
  title="Export as Word"
  class="p-1 hover:bg-gray-100 rounded"
>
  🧾
</button>
<button
  onclick={shareByEmail}
  title="Share via Email"
  class="p-1 hover:bg-gray-100 rounded"
>
  ✉️
</button>
