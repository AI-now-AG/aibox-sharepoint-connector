<script lang="ts">
  import { jsPDF } from "jspdf";
  import html2canvas from "html2canvas";
  import * as FileSaver from "file-saver";
  import { Document, Packer, Paragraph, TextRun } from "docx";

  interface Props {
    author?: string;
    message?: any;
    contentElement: HTMLElement;
  }
  const { author, message, contentElement }: Props = $props();

  function sanitizeColors(element: HTMLElement) {
    const allElements = element.querySelectorAll("*");
    allElements.forEach((el) => {
      const style = getComputedStyle(el);
      const bg = style.backgroundColor;

      if (bg.includes("lab(") || bg.includes("oklab(")) {
        (el as HTMLElement).style.backgroundColor = "rgb(255,255,255)";
      }
      const color = style.color;
      if (color.includes("lab(") || color.includes("oklab(")) {
        (el as HTMLElement).style.color = "rgb(0,0,0)";
      }
    });
  }

  // --- Export as PDF ---
  async function exportAsPDF() {
    const element = contentElement;
     sanitizeColors(element);
    const canvas = await html2canvas(element, {
      scale: 2, // better quality
      useCORS: true, // handle images properly
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("export.pdf");
  }

  // --- Export as Word ---
  async function exportAsWord() {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun({ text: message, font: "Arial" })],
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    FileSaver.saveAs(blob, `${author}-response.docx`);
  }

  // --- Share via Email ---
  function shareByEmail() {
    const subject = encodeURIComponent(`Shared response from ${author}`);
    const body = encodeURIComponent(message);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }
</script>

<div
  class="message-card relative bg-white dark:bg-gray-900 shadow p-4 rounded-2xl"
>
  <div class="flex justify-between items-start">
    <div class="flex flex-col gap-2 ml-2">
      <button
        onclick={exportAsPDF}
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
    </div>
  </div>
</div>

<style>
  .message-card {
    width: 100%;
  }
</style>
