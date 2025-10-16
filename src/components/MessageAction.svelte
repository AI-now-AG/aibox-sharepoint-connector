<script lang="ts">
  import * as FileSaver from "file-saver";
  import { Document, Packer, Paragraph, TextRun } from "docx";

  interface Props {
    author?: string;
    message?: any;
  }
  const { author, message }: Props = $props();

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
