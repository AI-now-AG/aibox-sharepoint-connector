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

  async function exportPdfClientSide(index: number = 0) {
    const fullHtml = html;
    const filename = `prompt-result-${Date.now()}.pdf`;
    try {
      // loading = true;
      const wrapper = document.createElement("div");
      wrapper.style.position = "fixed";
      wrapper.style.left = "-9999px";
      wrapper.style.top = "0";
      wrapper.style.opacity = "0";
      wrapper.style.pointerEvents = "none";
      wrapper.style.zIndex = "-9999";

      wrapper.innerHTML = `
        <div id="exportedContainer" style="font-family: Helvetica, sans-serif; font-size: 20px; line-height: 1.6; padding: 32px; width: 800px; background: white;">
        ${fullHtml}
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

      const dataUrl = await htmlToImage.toPng(container, {
        backgroundColor: "#ffffff",
        cacheBust: true,
        pixelRatio: 6, // higher = sharper text
        skipFonts: true,
        style: {
          fontFamily: "Helvetica, sans-serif",
          fontSize: "16px",
        },
      });

      document.body.removeChild(wrapper);

      // Create A4 PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;

      // Compute image scaling
      const imgProps = pdf.getImageProperties(dataUrl);
      const imgWidth = imgProps.width;
      const imgHeight = imgProps.height;
      const aspectRatio = imgHeight / imgWidth;

      // Scale image to nearly full width of the PDF (minus margin)
      const renderWidth = pdfWidth - margin * 2;
      const renderHeight = renderWidth * aspectRatio;

      pdf.addImage(
        dataUrl,
        "PNG",
        margin,
        margin,
        renderWidth,
        renderHeight > pdfHeight - 20 ? pdfHeight - 20 : renderHeight,
      );

      pdf.save(filename);

      // addToast({
      //   message: `✅ Email sent to ${toEmail} successfully!`,
      //   type: "success",
      // });
    } catch (err) {
      console.error("Failed to export PDF:", err);
      // addToast({
      //   message: "❌  Failed to export PDF",
      //   type: "error",
      // });
    } finally {
      // loading = false;
    }
  }

  async function exportWordClientSide(index: number = 0) {
    if (typeof window === "undefined") return;

    // Example: extract your HTML/text content
    const textElement = document.getElementById("exportedTextElement-" + index);
    const imageElement = document.getElementById(
      "exportedImageElement-" + index,
    );
    const text = textElement?.innerText ?? "";
    const imageSrc = imageElement?.querySelector("img")?.src ?? null;

    // 1️⃣ Create document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun(text)],
            }),
            ...(imageSrc ? [await createImageParagraph(imageSrc)] : []),
          ],
        },
      ],
    });

    // 2️⃣ Generate and download file
    const blob = await Packer.toBlob(doc);
    const filename = `exported-${Date.now()}.docx`;

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // Utility to embed image
  async function createImageParagraph(src: string) {
    const res = await fetch(src);
    const arrayBuffer = await res.arrayBuffer();
    const { ImageRun, Paragraph } = await import("docx");

    return new Paragraph({
      children: [
        new ImageRun({
          data: arrayBuffer,
          transformation: { width: 400, height: 300 },
        } as any),
      ],
    });
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
  onclick={() => exportWordClientSide(0)}
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
