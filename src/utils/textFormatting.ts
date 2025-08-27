function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildNumberedCitationLinks(
  inputString: string,
  citations: string[],
): string {
  return inputString.replace(/\[(\d+)\]/g, (match, p1) => {
    const index = parseInt(p1, 10) - 1;
    if (index >= 0 && index < citations.length) {
      const url = citations[index];
      return `[<span style="font-size: 0.8rem;">[${p1}]</span>](${url})`;
    }
    return match;
  });
}

function buildIconCitationLinks(
  inputString: string,
  citations: Record<string, any>[],
): string {
  if (!citations || !citations.length) return inputString;

  let result = inputString;

  citations.forEach((c) => {
    if (!c.text || !Array.isArray(c.sources)) return;

    const anchors = c.sources
      .map((s) => {
        const icon = `<span style="font-size: 0.5rem;" title="${s.title || ""}">🔗</span>`;
        const url = s.uri || s.url || s;
        return url ? `[${icon}](${url})` : "";
      })
      .join(" ");

    // Replace only the first occurrence of the citation text with itself + links
    result = result.replace(c.text, `${c.text} ${anchors}`);
  });

  return result;
}

export function buildCitationLinks(
  inputString: string,
  citations: (string | Record<string, any>)[],
): string {
  if (!citations?.length) {
    return inputString;
  }

  // string[] case
  if (typeof citations[0] === "string") {
    return buildNumberedCitationLinks(inputString, citations as string[]);
  }

  // object[] case (explicitly narrow type)
  if (typeof citations[0] === "object" && citations[0] !== null) {
    return buildIconCitationLinks(
      inputString,
      citations as Record<string, any>[],
    );
  }

  // fallback: return unchanged
  return inputString;
}

export function formatMarkdown(text: string): string {
  // 1. Handle code blocks first to protect their internal structure from other replacements.
  // This ensures markdown like '```js\nconsole.log("hello");\n```' is correctly parsed.
  text = text.replace(/```([\s\S]*?)```/g, (match, codeContent) => {
    // Trim any leading/trailing newlines within the code content to ensure clean <pre><code>.
    return `<pre class="bg-gray-800 text-white p-4 rounded-lg my-4 overflow-x-auto"><code class="language-plaintext">${escapeHtml(codeContent.trim())}</code></pre>`;
  });

  // 2. Handle Markdown headings (h1-h6) with Tailwind CSS classes for styling.
  // Added `font-bold` for H1 and `font-semibold` for H2-H6, along with margin for spacing.
  text = text.replace(
    /^###### (.*)$/gm,
    "<h6 class='text-xs font-semibold mt-4 mb-2'>$1</h6>",
  );
  text = text.replace(
    /^##### (.*)$/gm,
    "<h5 class='text-sm font-semibold mt-4 mb-2'>$1</h5>",
  );
  text = text.replace(
    /^#### (.*)$/gm,
    "<h4 class='text-base font-semibold mt-4 mb-2'>$1</h4>",
  );
  text = text.replace(
    /^### (.*)$/gm,
    "<h3 class='text-lg font-semibold mt-4 mb-2'>$1</h3>",
  );
  text = text.replace(
    /^## (.*)$/gm,
    "<h2 class='text-xl font-semibold mt-4 mb-2'>$1</h2>",
  );
  text = text.replace(
    /^# (.*)$/gm,
    "<h1 class='text-2xl font-bold mt-4 mb-2'>$1</h1>",
  );

  // 3. Handle inline markdown formatting.
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"); // Bold
  //text = text.replace(/(\*|_)(.*?)\1/g, "<em>$2</em>"); // Italic
  text = text.replace(/(\*|_)(?![^\\(]*\))(.+?)\1/g, "<em>$2</em>"); // Italic
  text = text.replace(/__(.*?)__/g, "<u>$1</u>"); // Underline
  text = text.replace(/~~(.*?)~~/g, "<del>$1</del>"); // Strikethrough
  text = text.replace(
    /`(.*?)`/g,
    "<code class='bg-gray-200 text-red-700 px-1 py-0.5 rounded text-sm'>$1</code>",
  ); // Inline code with subtle styling

  // 4. Handle Markdown Tables. This is a multi-step process using a replacer function.
  // The regex captures the header line, the separator line (with alignment indicators),
  // and all subsequent body lines.
  const tableRegex =
    /^\|(.+)\|(?:\r?\n|\r)(?:\s*\|(?: *:?-+:? *\|)+)(?:\r?\n|\r)((?:\|.*\|(?:\r?\n|\r))*)/gm;

  text = text.replace(
    tableRegex,
    (match, headerLine: string, bodyLines: string) => {
      // Extract and trim headers. Filter out empty strings from splitting.
      const headers = headerLine
        .split("|")
        .map((h) => h.trim())
        .filter((h) => h !== "");

      let htmlTable =
        '<table class="w-full border-collapse table-auto my-4 rounded-lg overflow-hidden shadow-md">';
      htmlTable += '<thead class="bg-blue-600 text-white">';
      htmlTable += '<tr class="text-left">';
      headers.forEach((header) => {
        htmlTable += `<th class="p-3 border-r border-blue-700 last:border-r-0 font-semibold uppercase text-sm">${header}</th>`;
      });
      htmlTable += "</tr>";
      htmlTable += "</thead>";
      htmlTable += "<tbody>";

      // Process body rows if they exist.
      if (bodyLines) {
        // Split body lines and filter out any empty lines.
        const rows = bodyLines
          .split(/\r?\n|\r/)
          .filter((line) => line.trim() !== "");
        rows.forEach((row, index) => {
          // Cells are split by '|' and trimmed. Filter out empty strings.
          const cells = row
            .split("|")
            .map((c) => c.trim())
            .filter((c) => c !== "");
          // Apply alternating background colors for better readability.
          const rowBgClass = index % 2 === 0 ? "bg-white" : "bg-gray-50";
          htmlTable += `<tr class="${rowBgClass} hover:bg-gray-100 transition-colors duration-200">`;
          cells.forEach((cell) => {
            htmlTable += `<td class="p-3 border-r border-gray-200 last:border-r-0 text-gray-800">${cell}</td>`;
          });
          htmlTable += "</tr>";
        });
      }

      htmlTable += "</tbody>";
      htmlTable += "</table>";
      return htmlTable;
    },
  );

  // 6. Replace links and remove all HTML tags inside link text
  text = text.replace(/\[([\s\S]+?)\]\(([^)]+)\)/g, (_match, p1, p2) => {
    return `<a class="btn btn-xs btn-soft btn-info ml-1" href="${p2}" target="_blank" rel="noopener noreferrer" style="height: auto; padding: 1px 3px; border-radius: 2px;">${p1}</a>`;
  });

  // 7. Finally, replace remaining standalone newlines with <br> tags.
  // This step comes last to avoid converting newlines within already-generated HTML structures.
  text = text.replace(/\n/g, "<br>");

  return text;
}

export function stripHtmlFormatting(text: string): string {
  text = text.replace(/<\/?(strong|em|u|del|code|pre|h[1-6][^>]*)>/gi, "");
  text = text.replace(/<br>/gi, "\n");
  text = text.replace(/<[^>]+>/g, "");
  return text.trim();
}
