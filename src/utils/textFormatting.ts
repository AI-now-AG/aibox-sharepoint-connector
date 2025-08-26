function formatCitationLinksNumber(
  inputString: string,
  citations: string[],
): string {
  return inputString.replace(/\[(\d+)\]/g, (match, p1) => {
    const index = parseInt(p1, 10) - 1;
    if (index >= 0 && index < citations.length) {
      const url = citations[index];
      return `<a href="${url}" target="_blank" class="bg-base-200 hover:bg-info text-info hover:text-base-200 text-xs font-normal ml-1 rounded-sm">[${p1}]</a>`;
    }
    return match;
  });
}

export function formatCitationLinksIcons(
  inputString: string,
  citations: Record<string, any>[],
): string {
  if (!citations || !citations.length) return inputString;

  // Keep SVG inline so no line breaks mess it up
  const icon = `<span class="text-xs">🔗</span>`;

  let result = inputString;

  citations.forEach((c) => {
    if (!c.text || !Array.isArray(c.sources)) return;

    const anchors = c.sources
      .map((s) => {
        const url = s.uri || s.url || s;
        return url ? `[${icon}](${url})` : "";
      })
      .join(" ");

    // Replace only the first occurrence of the citation text with itself + links
    result = result.replace(c.text, `${c.text} ${anchors}`);
  });

  return result;
}

export function formatCitations(
  inputString: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  citations: (string | Record<string, any>)[],
): string {
  if (!citations?.length) {
    return inputString;
  }

  // string[] case
  if (typeof citations[0] === "string") {
    return formatCitationLinksNumber(inputString, citations as string[]);
  }

  // object[] case (explicitly narrow type)
  if (typeof citations[0] === "object" && citations[0] !== null) {
    return formatCitationLinksIcons(
      inputString,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      citations as Record<string, any>[],
    );
  }

  // fallback: return unchanged
  return inputString;
}

export function formatMarkdown(text: string) {
  // Headings
  text = text.replace(/^###### (.*)$/gm, "<h6 class='text-xs'>$1</h6>");
  text = text.replace(/^##### (.*)$/gm, "<h5 class='text-sm'>$1</h5>");
  text = text.replace(/^#### (.*)$/gm, "<h4 class='text-base'>$1</h4>");
  text = text.replace(/^### (.*)$/gm, "<h3 class='text-lg'>$1</h3>");
  text = text.replace(/^## (.*)$/gm, "<h2 class='text-xl'>$1</h2>");
  text = text.replace(/^# (.*)$/gm, "<h1 class='text-2xl'>$1</h1>");

  // Formatting
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/(\*|_)(.*?)\1/g, "<em>$2</em>");
  text = text.replace(/__(.*?)__/g, "<u>$1</u>");
  text = text.replace(/~~(.*?)~~/g, "<del>$1</del>");
  text = text.replace(/`(.*?)`/g, "<code>$1</code>");
  text = text.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");

  // Replace links and remove all HTML tags inside link text
  text = text.replace(/\[([\s\S]+?)\]\(([^)]+)\)/g, (_match, p1, p2) => {
    // Remove any HTML tags from the URL
    const cleanUrl = p2.replace(/<\/?[^>]+(>|$)/g, ""); // removes <tag> or </tag>
    return `<a href='${encodeURI(cleanUrl)}' target='_blank' rel='noopener noreferrer'>${p1}</a>`;
  });

  // Line breaks
  text = text.replace(/\n/g, "<br>");

  return text;
}

export function stripHtmlFormatting(text: string): string {
  text = text.replace(/<\/?(strong|em|u|del|code|pre|h[1-6][^>]*)>/gi, "");
  text = text.replace(/<br>/gi, "\n");
  text = text.replace(/<[^>]+>/g, "");
  return text.trim();
}
