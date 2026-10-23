/**
 * Converts markdown text into structured BlockNote-compatible JSON blocks
 * This provides a guaranteed fallback and normalization layer for BlockNote.
 */
export const markdownToBlocks = (markdown = "") => {
  if (!markdown || typeof markdown !== "string") {
    return [
      {
        type: "paragraph",
        content: [],
      },
    ];
  }

  const lines = markdown.split(/\r?\n/);
  const blocks = [];
  let inCodeBlock = false;
  let codeBuffer = [];
  let codeLanguage = "javascript";

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Code block detection
    if (line.startsWith("```")) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim() || "text";
        codeBuffer = [];
      } else {
        inCodeBlock = false;
        blocks.push({
          type: "codeBlock",
          props: { language: codeLanguage },
          content: [
            {
              type: "text",
              text: codeBuffer.join("\n"),
              styles: {},
            },
          ],
        });
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    // Skip empty lines between paragraphs (or represent as empty paragraph)
    if (!line) {
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      blocks.push({
        type: "heading",
        props: { level: 3 },
        content: parseInlineStyles(line.slice(4)),
      });
    } else if (line.startsWith("## ")) {
      blocks.push({
        type: "heading",
        props: { level: 2 },
        content: parseInlineStyles(line.slice(3)),
      });
    } else if (line.startsWith("# ")) {
      blocks.push({
        type: "heading",
        props: { level: 1 },
        content: parseInlineStyles(line.slice(2)),
      });
    }
    // Checklists
    else if (/^-\s+\[([ xX])\]\s+(.*)/.test(line)) {
      const match = line.match(/^-\s+\[([ xX])\]\s+(.*)/);
      const isChecked = match[1].toLowerCase() === "x";
      blocks.push({
        type: "checkListItem",
        props: { checked: isChecked },
        content: parseInlineStyles(match[2]),
      });
    }
    // Bullet lists
    else if (/^[-*+]\s+(.*)/.test(line)) {
      const match = line.match(/^[-*+]\s+(.*)/);
      blocks.push({
        type: "bulletListItem",
        content: parseInlineStyles(match[1]),
      });
    }
    // Numbered lists
    else if (/^\d+\.\s+(.*)/.test(line)) {
      const match = line.match(/^\d+\.\s+(.*)/);
      blocks.push({
        type: "numberedListItem",
        content: parseInlineStyles(match[1]),
      });
    }
    // Standard paragraphs
    else {
      blocks.push({
        type: "paragraph",
        content: parseInlineStyles(line),
      });
    }
  }

  // Handle unclosed code block
  if (inCodeBlock && codeBuffer.length > 0) {
    blocks.push({
      type: "codeBlock",
      props: { language: codeLanguage },
      content: [
        {
          type: "text",
          text: codeBuffer.join("\n"),
          styles: {},
        },
      ],
    });
  }

  // Ensure at least one block exists
  if (blocks.length === 0) {
    blocks.push({
      type: "paragraph",
      content: [],
    });
  }

  return blocks;
};

/**
 * Parses bold, italic, and inline code markdown into BlockNote text styled tokens
 */
function parseInlineStyles(text) {
  if (!text) return [];

  // Simple token parser for bold, italic, code
  // For basic clean text, return as text segment
  const tokens = [];
  let remaining = text;

  // Pattern matches `code`, **bold**, *italic*
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/;

  while (remaining.length > 0) {
    const match = remaining.match(pattern);
    if (!match) {
      tokens.push({
        type: "text",
        text: remaining,
        styles: {},
      });
      break;
    }

    const matchIndex = match.index;
    if (matchIndex > 0) {
      tokens.push({
        type: "text",
        text: remaining.slice(0, matchIndex),
        styles: {},
      });
    }

    const matchedStr = match[0];
    if (matchedStr.startsWith("`") && matchedStr.endsWith("`")) {
      tokens.push({
        type: "text",
        text: matchedStr.slice(1, -1),
        styles: { code: true },
      });
    } else if (matchedStr.startsWith("**") && matchedStr.endsWith("**")) {
      tokens.push({
        type: "text",
        text: matchedStr.slice(2, -2),
        styles: { bold: true },
      });
    } else if (matchedStr.startsWith("*") && matchedStr.endsWith("*")) {
      tokens.push({
        type: "text",
        text: matchedStr.slice(1, -1),
        styles: { italic: true },
      });
    }

    remaining = remaining.slice(matchIndex + matchedStr.length);
  }

  return tokens;
}
