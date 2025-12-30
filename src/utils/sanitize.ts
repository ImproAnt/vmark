/**
 * HTML Sanitization Utilities
 *
 * Provides secure HTML sanitization using DOMPurify to prevent XSS attacks.
 */

import DOMPurify from "dompurify";

/**
 * Sanitize HTML content, removing potentially dangerous elements.
 * Safe for general HTML content.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "div",
      "span",
      "p",
      "br",
      "strong",
      "em",
      "b",
      "i",
      "u",
      "s",
      "code",
      "pre",
      "blockquote",
      "ul",
      "ol",
      "li",
      "a",
      "img",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "hr",
      "sub",
      "sup",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "id", "target"],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize SVG content for safe rendering (e.g., Mermaid diagrams).
 * Allows SVG elements but removes scripts and event handlers.
 */
export function sanitizeSvg(svg: string): string {
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ["foreignObject"],
    FORBID_TAGS: ["script"],
    FORBID_ATTR: [
      "onerror",
      "onload",
      "onclick",
      "onmouseover",
      "onfocus",
      "onblur",
    ],
  });
}

/**
 * Sanitize KaTeX output for safe rendering.
 */
export function sanitizeKatex(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "span",
      "math",
      "semantics",
      "mrow",
      "mi",
      "mo",
      "mn",
      "msup",
      "msub",
      "mfrac",
      "mover",
      "munder",
      "munderover",
      "msqrt",
      "mroot",
      "mtable",
      "mtr",
      "mtd",
      "mtext",
      "mspace",
      "annotation",
      "svg",
      "line",
      "path",
    ],
    ALLOWED_ATTR: [
      "class",
      "style",
      "mathvariant",
      "displaystyle",
      "scriptlevel",
      "width",
      "height",
      "viewBox",
      "preserveAspectRatio",
      "xmlns",
      "d",
      "x1",
      "y1",
      "x2",
      "y2",
      "stroke",
      "stroke-width",
    ],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Escape HTML entities for safe text display.
 * Use when displaying raw content in error messages.
 */
export function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
}
