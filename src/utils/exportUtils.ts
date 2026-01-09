/**
 * Export Utilities (Pure)
 *
 * Pure functions for markdown-to-HTML conversion and styling.
 * Async operations (file saving, clipboard) are in hooks/useExportOperations.
 */

import { marked } from "marked";
import DOMPurify from "dompurify";

// Configure marked for GFM (GitHub Flavored Markdown)
marked.setOptions({
  gfm: true,
  breaks: false,
});

/**
 * GitHub-style CSS for exported HTML
 */
export const EXPORT_CSS = `
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: #1f2328;
  background-color: #ffffff;
  max-width: 900px;
  margin: 0 auto;
  padding: 32px;
}

h1, h2, h3, h4, h5, h6 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

h1 { font-size: 2em; border-bottom: 1px solid #d1d5da; padding-bottom: 0.3em; }
h2 { font-size: 1.5em; border-bottom: 1px solid #d1d5da; padding-bottom: 0.3em; }
h3 { font-size: 1.25em; }
h4 { font-size: 1em; }
h5 { font-size: 0.875em; }
h6 { font-size: 0.85em; color: #656d76; }

p { margin-top: 0; margin-bottom: 16px; }

a { color: #0969da; text-decoration: none; }
a:hover { text-decoration: underline; }

code {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 85%;
  background-color: #f6f8fa;
  padding: 0.2em 0.4em;
  border-radius: 6px;
}

pre {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 85%;
  background-color: #f6f8fa;
  padding: 16px;
  overflow: auto;
  border-radius: 6px;
  line-height: 1.45;
}

pre code {
  background-color: transparent;
  padding: 0;
  border-radius: 0;
}

blockquote {
  margin: 0 0 16px 0;
  padding: 0 1em;
  color: #656d76;
  border-left: 0.25em solid #d1d5da;
}

ul, ol {
  margin-top: 0;
  margin-bottom: 16px;
  padding-left: 2em;
}

li { margin-top: 0.25em; }
li + li { margin-top: 0.25em; }

table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 16px;
}

th, td {
  padding: 6px 13px;
  border: 1px solid #d1d5da;
}

th {
  font-weight: 600;
  background-color: #f6f8fa;
}

tr:nth-child(2n) { background-color: #f6f8fa; }

hr {
  height: 0.25em;
  padding: 0;
  margin: 24px 0;
  background-color: #d1d5da;
  border: 0;
}

img {
  max-width: 100%;
  height: auto;
}

/* Task lists */
.task-list-item {
  list-style-type: none;
}

.task-list-item input {
  margin-right: 0.5em;
}

/* Alert blocks (GFM) */
.markdown-alert {
  padding: 8px 16px;
  margin-bottom: 16px;
  border-left: 4px solid;
  border-radius: 6px;
}

.markdown-alert-note { border-color: #0969da; background-color: #ddf4ff; }
.markdown-alert-tip { border-color: #1a7f37; background-color: #dafbe1; }
.markdown-alert-important { border-color: #8250df; background-color: #fbefff; }
.markdown-alert-warning { border-color: #9a6700; background-color: #fff8c5; }
.markdown-alert-caution { border-color: #cf222e; background-color: #ffebe9; }

@media print {
  body { max-width: none; padding: 0; }
  pre { white-space: pre-wrap; word-wrap: break-word; }
}
`.trim();

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Convert markdown to HTML (sanitized to prevent XSS)
 */
export function markdownToHtml(markdown: string): string {
  const rawHtml = marked.parse(markdown, { async: false }) as string;
  return DOMPurify.sanitize(rawHtml);
}

/**
 * Generate complete HTML document with styles
 */
export function generateHtmlDocument(
  markdown: string,
  title: string = "Document",
  includeStyles: boolean = true
): string {
  const htmlContent = markdownToHtml(markdown);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  ${includeStyles ? `<style>${EXPORT_CSS}</style>` : ""}
</head>
<body>
${htmlContent}
</body>
</html>`;
}

/**
 * Apply inline styles for PDF rendering
 */
export function applyPdfStyles(container: HTMLElement): void {
  // Headings
  container.querySelectorAll("h1").forEach((el) => {
    (el as HTMLElement).style.cssText =
      "font-size: 24px; font-weight: 600; margin: 20px 0 12px; border-bottom: 1px solid #d1d5da; padding-bottom: 8px;";
  });
  container.querySelectorAll("h2").forEach((el) => {
    (el as HTMLElement).style.cssText =
      "font-size: 20px; font-weight: 600; margin: 18px 0 10px; border-bottom: 1px solid #d1d5da; padding-bottom: 6px;";
  });
  container.querySelectorAll("h3").forEach((el) => {
    (el as HTMLElement).style.cssText =
      "font-size: 16px; font-weight: 600; margin: 16px 0 8px;";
  });
  container.querySelectorAll("h4, h5, h6").forEach((el) => {
    (el as HTMLElement).style.cssText =
      "font-size: 14px; font-weight: 600; margin: 14px 0 6px;";
  });

  // Code blocks
  container.querySelectorAll("pre").forEach((el) => {
    (el as HTMLElement).style.cssText =
      "background-color: #f6f8fa; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 12px; overflow: auto; white-space: pre-wrap; word-wrap: break-word;";
  });
  container.querySelectorAll("code").forEach((el) => {
    if ((el as HTMLElement).parentElement?.tagName !== "PRE") {
      (el as HTMLElement).style.cssText =
        "background-color: #f6f8fa; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px;";
    }
  });

  // Blockquotes
  container.querySelectorAll("blockquote").forEach((el) => {
    (el as HTMLElement).style.cssText =
      "margin: 0 0 12px 0; padding: 0 12px; color: #656d76; border-left: 4px solid #d1d5da;";
  });

  // Tables
  container.querySelectorAll("table").forEach((el) => {
    (el as HTMLElement).style.cssText =
      "border-collapse: collapse; width: 100%; margin-bottom: 12px;";
  });
  container.querySelectorAll("th, td").forEach((el) => {
    (el as HTMLElement).style.cssText =
      "padding: 6px 12px; border: 1px solid #d1d5da;";
  });
  container.querySelectorAll("th").forEach((el) => {
    (el as HTMLElement).style.cssText +=
      "font-weight: 600; background-color: #f6f8fa;";
  });

  // Links
  container.querySelectorAll("a").forEach((el) => {
    (el as HTMLElement).style.cssText = "color: #0969da; text-decoration: none;";
  });

  // Horizontal rules
  container.querySelectorAll("hr").forEach((el) => {
    (el as HTMLElement).style.cssText =
      "height: 2px; margin: 20px 0; background-color: #d1d5da; border: 0;";
  });

  // Images
  container.querySelectorAll("img").forEach((el) => {
    (el as HTMLElement).style.cssText = "max-width: 100%; height: auto;";
  });
}
