import { marked, type Tokens } from "marked";
import TurndownService from "turndown";

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
  citations: Record<string, unknown>[],
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
    result = result.replace(c.text as string, `${c.text} ${anchors}`);
  });

  return result;
}

/**
 * Build citation links into a Markdown string.
 *
 * - Supports numbered citations (`string[]`) or icon-style citations (`object[]`).
 * - Returns the input unchanged if no citations are provided.
 *
 * @param inputString - The base Markdown text
 * @param citations - Citation strings or objects
 * @returns Markdown string with citation links
 */
export function buildCitationLinks(
  inputString: string,
  citations: (string | Record<string, unknown>)[],
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
      citations as Record<string, unknown>[],
    );
  }

  // fallback: return unchanged
  return inputString;
}

/**
 * Convert Markdown text to styled HTML using marked.js with custom renderers.
 *
 * @param text - Markdown string
 * @returns HTML string
 */
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
          const ulClass = "list-disc space-y-1 ml-4 mb-3";
          const olClass = "list-decimal space-y-1 ml-4 mb-3";

          const body = (token.items || [])
            .map(
              (item: Tokens.ListItem) =>
                //this.parser.parseInline(item.tokens || []),
                this.parser.parse(item.tokens || []), // Handle block tokens inside list items
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
          const outerWrapper = "w-full max-w-full overflow-x-auto my-4";
          const innerWrapper = "inline-block min-w-max align-top";
          const tableClass =
            "border-collapse table-auto rounded-lg overflow-hidden shadow-md";

          const thClass =
            "p-2 border-r border-primary last:border-r-0 font-semibold text-sm";
          const trClass = "hover:bg-base-300 transition-colors duration-200";
          const tdClass = "p-2 border-r last:border-r-0 text-base-content";

          const header = token.header
            .map((cell: Tokens.TableCell) => {
              const inner = marked.parseInline(cell.text || "");
              return `<th class="${thClass}">${inner}</th>`;
            })
            .join("");

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
            <div class="${outerWrapper}">
              <div class="${innerWrapper}">
                <table class="${tableClass}">
                  <thead class="bg-primary text-white"><tr>${header}</tr></thead>
                  <tbody>${body}</tbody>
                </table>
              </div>
            </div>
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

      // Code blocks + inline code
      {
        name: "code",
        renderer(this, token) {
          const langClass = token.lang
            ? `language-${token.lang}`
            : "language-plaintext";

          if (token.raw.startsWith("```")) {
            // fenced block
            return `<pre class="whitespace-pre-wrap break-words p-3 rounded-md bg-base-200 overflow-x-auto"><code class="${langClass}">${token.text}</code></pre>`;
          }

          // inline code
          return `<code class="px-1 rounded bg-base-200 text-base-content">${token.text}</code>`;
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

  return marked.parse(text) as string;
}

/**
 * Convert plain text to safe HTML.
 *
 * @param text - Input text
 * @returns HTML string
 */
export function textToHtml(text: string): string {
  // Escape HTML entities first
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // Convert line breaks → <br>
  const withBreaks = escaped.replace(/\n/g, "<br>");

  // Wrap in a paragraph
  return `<p>${withBreaks}</p>`;
}

/**
 * Convert raw Markdown-like text to simple HTML.
 * If the input already contains HTML, it is returned unchanged.
 *
 * @param text - Markdown or HTML string
 * @returns HTML string
 */
export function normalizeTextToHtml(text: string) {
  // If input already looks like HTML, skip formatting
  if (/<[a-z][\s\S]*>/i.test(text)) {
    return text;
  }

  // Otherwise, apply simple Markdown replacements
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

/**
 * Removes common Markdown formatting while keeping readable text.
 *
 * Strips code blocks, inline code, bold/italic, strikethrough,
 * headings, blockquotes, lists, links, images, rules, and footnotes.
 *
 * @param text - String containing Markdown.
 * @returns Clean plain text.
 */
export function stripMarkdownFormatting(text: string): string {
  text = text.replace(/```[\s\S]*?```/g, ""); // fenced code blocks
  text = text.replace(/`([^`]*)`/g, "$1"); // inline code
  text = text.replace(/(\*\*|__)(.*?)\1/g, "$2"); // bold
  text = text.replace(/(\*|_)(.*?)\1/g, "$2"); // italic
  text = text.replace(/~~(.*?)~~/g, "$1"); // strikethrough
  text = text.replace(/^#{1,6}\s+/gm, ""); // headings
  text = text.replace(/^>\s?/gm, ""); // blockquotes
  text = text.replace(/^(\s*[-*+]|\s*\d+\.)\s+/gm, ""); // lists
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // links
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1"); // images
  text = text.replace(/^(-{3,}|\*{3,}|_{3,})$/gm, ""); // horizontal rules
  text = text.replace(/\[\^.+?\](\\: .*?$)?/g, ""); // footnotes

  // Remove raw HTML tags (like <span>, <strong>, etc.)
  text = text.replace(/<[^>]+>/g, "");

  // Collapse multiple newlines
  text = text.replace(/\n{2,}/g, "\n\n");

  return text.trim();
}

/**
 * Convert HTML string to Markdown safely.
 *
 * @param html - HTML input
 * @returns Markdown string (or original HTML if conversion fails)
 */
export function htmlToMarkdown(html: string): string {
  try {
    const turndownService = new TurndownService({
      headingStyle: "atx", // #
      codeBlockStyle: "fenced", // ```
      emDelimiter: "*", // *italic*
      bulletListMarker: "-", // - list
    });
    // Override escape to avoid unnecessary backslashes
    turndownService.escape = (str: string) => str;

    return turndownService.turndown(html);
  } catch (err) {
    console.error("htmlToMarkdown failed:", err);
    return html; // fallback: return unchanged HTML
  }
}

/**
 * Removes HTML tags from text, preserving line breaks and plain content.
 *
 * @param text - String with HTML markup.
 * @returns Clean plain text.
 */
export function stripHtmlFormatting(text: string): string {
  text = text.replace(/<\/?(strong|em|u|del|code|pre|h[1-6][^>]*)>/gi, "");
  text = text.replace(/<br>/gi, "\n");
  text = text.replace(/<[^>]+>/g, "");
  return text.trim();
}

/**
 * Checks whether an HTML string is effectively empty.
 *
 * This is useful for WYSIWYG or rich-text editor fields that may output
 * minimal HTML (e.g., `<p></p>` or `<p><br></p>`) when no real text is entered.
 *
 * @param {string} html - The HTML string to evaluate.
 * @returns {boolean} `true` if the content is empty or contains only placeholder tags, otherwise `false`.
 */
export function isHtmlContentEmpty(html: string): boolean {
  if (!html) return true;
  const clean = html.trim().toLowerCase();
  return clean === "" || clean === "<p></p>" || clean === "<p><br></p>";
}

export function getLatestMarkdownHeader(text: string): string {
  // Match **content** with content allowed to span across newlines
  const closedRegex = /\*\*([\s\S]*?)\*\*/g;

  let match: RegExpExecArray | null;
  let lastClosedHeader = "";

  // Find the last fully closed header
  while ((match = closedRegex.exec(text)) !== null) {
    lastClosedHeader = match[1].trim();
  }

  if (lastClosedHeader) {
    return lastClosedHeader;
  }

  // If no closed header exists, check for a partial opening `**`
  const lastOpenIndex = text.lastIndexOf("**");
  if (lastOpenIndex !== -1) {
    const partial = text.slice(lastOpenIndex + 2).trim();
    return partial; // may be empty, caller decides if to show
  }

  return "";
}
