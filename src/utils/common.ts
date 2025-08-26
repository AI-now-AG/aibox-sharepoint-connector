/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-useless-escape */
import dayjs from "dayjs";

export function isTrulyEmpty(obj: any) {
  return !obj || Object.keys(obj).length === 0;
}

export function capitalizeFirst(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatDateToDDMMYY(date: string | Date): string {
  return dayjs(date).format("DD.MM.YYYY");
}

export const isValidEmail = (email: string) => {
  const emailRegex = /^[\w.+-]+@[\w.-]+\.\w{2,3}$/;
  return emailRegex.test(email);
};

export const preventDefault = (fn: any) => {
  return function (this: any, event: any) {
    event.preventDefault();
    fn.call(this, event);
  };
};

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function tryParse(input: string): object | string {
  let result;
  try {
    result = JSON.parse(input);
  } catch {
    result = input;
  }
  return result;
}

export function randomString(length: number = 5) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function parseChunkCitations(inputString: string): object | string {
  const unescapedString = inputString.replace(/\\\"/g, '"');
  const jsonMatch = unescapedString.match(/{.*?}/s);
  if (jsonMatch) {
    const jsonString = jsonMatch[0];
    try {
      const jsonObject = JSON.parse(jsonString);
      const citations = jsonObject.citations;
      const remainingText = unescapedString.slice(jsonString.length);
      const result = {
        citations,
        content: remainingText.trim(),
      };
      return result;
    } catch (error) {
      console.error("Error parsing JSON:", error);
    }
  }
  return inputString;
}

export function formatCitations(
  inputString: string,
  citations: Array<string>,
): string {
  const updatedString = inputString.replace(/\[(\d+)\]/g, (match, p1) => {
    const index = parseInt(p1, 10) - 1;
    if (index >= 0 && index < citations.length) {
      return `<a href='${citations[index]}' target='_blank' class='bg-base-200 hover:bg-info text-info hover:text-base-200 text-xs font-normal ml-1 rounded-sm justify-center items-center'>[${p1}]</a>`;
    }
    return match;
  });
  return updatedString;
}

export function formatMarkdown_bak(text: string) {
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

export function formatMarkdown(text: string): string {
  // 1. Handle code blocks first to protect their internal structure from other replacements.
  // This ensures markdown like '```js\nconsole.log("hello");\n```' is correctly parsed.
  text = text.replace(/```([\s\S]*?)```/g, (match, codeContent) => {
    // Trim any leading/trailing newlines within the code content to ensure clean <pre><code>.
    return `<pre class="bg-gray-800 text-white p-4 rounded-lg my-4 overflow-x-auto"><code class="language-plaintext">${codeContent.trim()}</code></pre>`;
  });

  // 2. Handle Markdown headings (h1-h6) with Tailwind CSS classes for styling.
  // Added `font-bold` for H1 and `font-semibold` for H2-H6, along with margin for spacing.
  text = text.replace(
    /^###### (.*)$/gm,
    "<h6 class='text-xs font-semibold mt-4 mb-2 text-gray-700'>$1</h6>",
  );
  text = text.replace(
    /^##### (.*)$/gm,
    "<h5 class='text-sm font-semibold mt-4 mb-2 text-gray-700'>$1</h5>",
  );
  text = text.replace(
    /^#### (.*)$/gm,
    "<h4 class='text-base font-semibold mt-4 mb-2 text-gray-700'>$1</h4>",
  );
  text = text.replace(
    /^### (.*)$/gm,
    "<h3 class='text-lg font-semibold mt-4 mb-2 text-gray-800'>$1</h3>",
  );
  text = text.replace(
    /^## (.*)$/gm,
    "<h2 class='text-xl font-semibold mt-4 mb-2 text-gray-800'>$1</h2>",
  );
  text = text.replace(
    /^# (.*)$/gm,
    "<h1 class='text-2xl font-bold mt-4 mb-2 text-gray-900'>$1</h1>",
  );

  // 3. Handle inline markdown formatting.
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"); // Bold
  text = text.replace(/(\*|_)(.*?)\1/g, "<em>$2</em>"); // Italic
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

  // 5. Finally, replace remaining standalone newlines with <br> tags.
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
