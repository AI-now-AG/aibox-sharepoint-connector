import { marked, type Tokens } from "marked";

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
        const icon = `<span class="tooltip" data-tip="${s.title || ""}" style="font-size: 0.5rem;">🔗</span>`;
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

export function markdownToHtml(text: string) {
  marked.use({
    breaks: true,
    gfm: true,
    silent: true,
    extensions: [
      // Paragraphs
      {
        name: "paragraph",
        level: "block",
        renderer(this, token) {
          const pClass = "mb-4";
          const inner = marked.parseInline(token.text || "");

          return `<p class="${pClass}">${inner}</p>`;
        },
      },

      // Headings (#, ##, ### ...)
      {
        name: "heading",
        renderer(this, token) {
          const classes: Record<number, string> = {
            1: "text-2xl font-semibold mt-4 mb-2",
            2: "text-xl font-semibold mt-4 mb-2",
            3: "text-lg font-semibold mt-4 mb-2",
            4: "text-base font-semibold mt-4 mb-2",
            5: "text-sm font-semibold mt-4 mb-2",
            6: "text-xs font-semibold mt-4 mb-2",
          };
          const headingClass = classes[token.depth] ?? "";
          const inner = this.parser.parseInline(token.tokens || []);

          return `<h${token.depth} class="${headingClass}"}>${inner}</h${token.depth}>`;
        },
      },

      // Lists (ul, ol)
      {
        name: "list",
        renderer(this, token) {
          const ulClass = "list-disc list-inside space-y-1 ml-4";
          const olClass = "list-decimal list-inside space-y-1 ml-4";

          const body = (token.items || [])
            .map((item: Tokens.ListItem) =>
              this.parser.parseInline(item.tokens || []),
            )
            .map((html: string) => `<li>${html}</li>`)
            .join("");

          if (token.ordered) {
            return `<ol class="${olClass}">${body}</ol>`;
          }
          return `<ul class="${ulClass}">${body}</ul>`;
        },
      },

      // Tables
      {
        name: "table",
        renderer(this, token) {
          const tableClass =
            "w-full border-collapse table-auto my-4 rounded-lg overflow-hidden shadow-md";
          const thClass =
            "p-2 border-r border-primary last:border-r-0 font-semibold text-sm";
          const trClass = "hover:bg-base-300 transition-colors duration-200";
          const tdClass = "p-2 border-r last:border-r-0 text-base-content";

          // Header row
          const header = token.header
            .map((cell: Tokens.TableCell) => {
              const inner = marked.parseInline(cell.text); // cell.text is string
              return `<th class="${thClass}">${inner}</th>`;
            })
            .join("");

          // Body rows
          const body = token.rows
            .map((row: Tokens.TableCell[], rowIndex: number) => {
              const cols = row
                .map((cell: Tokens.TableCell) => {
                  const inner = cell.tokens
                    ? this.parser.parseInline(cell.tokens)
                    : cell.text;
                  return `<td class="${tdClass}">${inner}</td>`;
                })
                .join("");

              const extraClass =
                rowIndex % 2 === 0 ? "bg-base-100" : "bg-base-300";
              return `<tr class="${trClass} ${extraClass}">${cols}</tr>`;
            })
            .join("");

          return `
            <table class="${tableClass}">
              <thead class="bg-primary text-white"><tr>${header}</tr></thead>
              <tbody>${body}</tbody>
            </table>
          `;
        },
      },

      // Links [text](url)
      {
        name: "link",
        level: "block",
        renderer(this, token) {
          const href = token.href;
          const title = token.title || "";
          const text = token.text || token.raw;

          const linkClass = "btn btn-xs btn-soft btn-info ml-1";
          const linkstyle =
            "height: auto; padding: 1px 3px; border-radius: 2px;";

          return `<a href="${href}" title="${title}" class="${linkClass}"} style="${linkstyle}"} target="_blank" rel="noopener noreferrer">${text}</a>`;
        },
      },

      // Horizontal Rule (--- *** ___)
      {
        name: "hr",
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        renderer(this, token): string {
          const hrClass = "border-t border-base-300 my-3";
          return `<hr class="${hrClass}" />`;
        },
      },
    ],
  });

  return marked.parse(text);
}

export function formatMarkdown(text: string) {
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/(\*|_)(.*?)\1/g, "<em>$2</em>");
  text = text.replace(/__(.*?)__/g, "<u>$1</u>");
  text = text.replace(/~~(.*?)~~/g, "<del>$1</del>");
  text = text.replace(/`(.*?)`/g, "<code>$1</code>");
  text = text.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
  text = text.replace(/^###### (.*)$/gm, "<h6 class='text-xs'>$1</h6>");
  text = text.replace(/^##### (.*)$/gm, "<h5 class='text-sm'>$1</h5>");
  text = text.replace(/^#### (.*)$/gm, "<h4 class='text-base'>$1</h4>");
  text = text.replace(/^### (.*)$/gm, "<h3 class='text-lg'>$1</h3>");
  text = text.replace(/^## (.*)$/gm, "<h2 class='text-xl'>$1</h2>");
  text = text.replace(/^# (.*)$/gm, "<h1 class='text-2xl'>$1</h1>");
  text = text.replace(/\n/g, "<br>");
  return text;
}

export function stripHtmlFormatting(text: string): string {
  text = text.replace(/<\/?(strong|em|u|del|code|pre|h[1-6][^>]*)>/gi, "");
  text = text.replace(/<br>/gi, "\n");
  text = text.replace(/<[^>]+>/g, "");
  return text.trim();
}
