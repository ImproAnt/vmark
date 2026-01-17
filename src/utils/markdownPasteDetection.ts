/**
 * Markdown paste detection
 *
 * Heuristics to decide whether plain text clipboard content
 * should be parsed as Markdown when pasting into WYSIWYG.
 */

const CODE_FENCE_RE = /^\s*(```|~~~)/;
const HEADING_RE = /^\s*#{1,6}\s+/;
const BLOCKQUOTE_RE = /^\s*>\s+/;
const LIST_RE = /^\s*(?:[-*+]|\d+\.)\s+/;
const HR_RE = /^\s*(?:-{3,}|_{3,}|\*{3,})\s*$/;
const LINK_RE = /!?\[[^\]]+\]\([^)]+\)/;

function isTableSeparator(line: string): boolean {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function isTableHeader(line: string): boolean {
  return /\|/.test(line);
}

export function isMarkdownPasteCandidate(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  const lines = trimmed.split(/\r?\n/);
  const hasNewline = lines.length > 1;

  let signalCount = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (CODE_FENCE_RE.test(line)) return true;

    if (isTableHeader(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      return true;
    }

    if (HEADING_RE.test(line)) signalCount += 1;
    if (BLOCKQUOTE_RE.test(line)) signalCount += 1;
    if (LIST_RE.test(line)) signalCount += 1;
    if (HR_RE.test(line)) signalCount += 1;
    if (LINK_RE.test(line)) signalCount += 1;
  }

  if (hasNewline && signalCount > 0) return true;
  if (!hasNewline && signalCount >= 2) return true;

  return false;
}
