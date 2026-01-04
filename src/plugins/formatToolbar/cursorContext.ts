/**
 * Cursor Context Computation for Milkdown Mode
 *
 * Computes the full cursor context by walking the ProseMirror document tree.
 * Called on every selection change, result is cached in store.
 */

import type { EditorView } from "@milkdown/kit/prose/view";
import type {
  CursorContext,
  CodeBlockContext,
  TableContext,
  ListContext,
  BlockquoteContext,
  HeadingContext,
  ContextMode,
  LinkContext,
  ImageContext,
  InlineMathContext,
  FootnoteContext,
  FormattedRangeContext,
} from "@/types/cursorContext";
import type { FormatType } from "@/plugins/sourceFormatPopup/formatActions";
import { findWordAtCursor, findAnyMarkRangeAtCursor } from "@/plugins/syntaxReveal/marks";

/**
 * Get code block info if cursor is inside a code block node.
 */
function getCodeBlockContext(view: EditorView): CodeBlockContext | null {
  const { $from } = view.state.selection;
  for (let d = $from.depth; d > 0; d--) {
    const node = $from.node(d);
    if (node.type.name === "code_block" || node.type.name === "fence") {
      return {
        language: node.attrs.language || "",
        nodePos: $from.before(d),
      };
    }
  }
  return null;
}

/**
 * Get heading info if cursor is inside a heading node.
 */
function getHeadingContext(view: EditorView): HeadingContext | null {
  const { $from } = view.state.selection;
  for (let d = $from.depth; d > 0; d--) {
    const node = $from.node(d);
    if (node.type.name === "heading") {
      return {
        level: node.attrs.level || 1,
        nodePos: $from.before(d),
      };
    }
  }
  return null;
}

/**
 * Get list context if cursor is inside a list.
 */
function getListContext(view: EditorView): ListContext | null {
  const { $from } = view.state.selection;
  let depth = 0;

  for (let d = $from.depth; d > 0; d--) {
    const node = $from.node(d);
    const name = node.type.name;

    if (name === "bullet_list") {
      return {
        type: "bullet",
        depth: depth + 1,
        nodePos: $from.before(d),
      };
    }
    if (name === "ordered_list") {
      return {
        type: "ordered",
        depth: depth + 1,
        nodePos: $from.before(d),
      };
    }
    if (name === "task_list_item" || name === "list_item") {
      depth++;
    }
  }
  return null;
}

/**
 * Get blockquote context if cursor is inside a blockquote.
 */
function getBlockquoteContext(view: EditorView): BlockquoteContext | null {
  const { $from } = view.state.selection;
  let depth = 0;

  for (let d = $from.depth; d > 0; d--) {
    const node = $from.node(d);
    if (node.type.name === "blockquote") {
      depth++;
      return {
        depth,
        nodePos: $from.before(d),
      };
    }
  }
  return null;
}

/**
 * Get table context if cursor is inside a table.
 */
function getTableContext(view: EditorView): TableContext | null {
  const { $from } = view.state.selection;

  for (let d = $from.depth; d > 0; d--) {
    const node = $from.node(d);
    const name = node.type.name;

    if (name === "table_cell" || name === "table_header") {
      // Find parent table row and table
      for (let td = d - 1; td > 0; td--) {
        const parent = $from.node(td);
        if (parent.type.name === "table_row") {
          // Count row and col index
          const rowPos = $from.before(td);
          const tablePos = $from.before(td - 1);
          const table = $from.node(td - 1);

          let row = 0;
          let col = 0;

          // Count rows before current
          table.forEach((_child, offset) => {
            if (tablePos + offset + 1 < rowPos) row++;
          });

          // Count cells before current in this row
          const currentRow = parent;
          const cellPos = $from.before(d);
          currentRow.forEach((_cell, offset) => {
            if (rowPos + offset + 1 < cellPos) col++;
          });

          return {
            row,
            col,
            isHeader: name === "table_header" || row === 0,
            nodePos: tablePos,
          };
        }
      }
    }
  }
  return null;
}

/**
 * Check if cursor is at a blank line.
 */
function isAtBlankLine(view: EditorView): boolean {
  const { $from } = view.state.selection;
  return $from.parent.textContent.trim() === "";
}

/**
 * Check if cursor is at the start of a paragraph.
 */
function isAtLineStart(view: EditorView): boolean {
  const { $from } = view.state.selection;

  if ($from.parentOffset !== 0) {
    const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
    if (textBefore.trim() !== "") return false;
  }

  if ($from.parent.type.name !== "paragraph") return false;
  if ($from.parent.textContent.trim() === "") return false;

  // Not in special containers
  for (let d = $from.depth - 1; d > 0; d--) {
    const name = $from.node(d).type.name;
    if (
      name === "list_item" ||
      name === "bullet_list" ||
      name === "ordered_list" ||
      name === "blockquote" ||
      name === "table_cell" ||
      name === "table_header" ||
      name === "code_block" ||
      name === "fence"
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Check if cursor is near whitespace.
 */
function isNearSpace(view: EditorView): boolean {
  const { $from } = view.state.selection;
  const text = $from.parent.textContent;
  const offset = $from.parentOffset;

  if (offset > 0 && /\s/.test(text[offset - 1])) return true;
  if (offset < text.length && /\s/.test(text[offset])) return true;

  return false;
}

/**
 * Check if cursor is near punctuation.
 */
function isNearPunctuation(view: EditorView): boolean {
  const { $from } = view.state.selection;
  const text = $from.parent.textContent;
  const offset = $from.parentOffset;
  const punctuationRegex = /[\p{P}]/u;

  if (offset > 0 && punctuationRegex.test(text[offset - 1])) return true;
  if (offset < text.length && punctuationRegex.test(text[offset])) return true;

  return false;
}

/**
 * Get link context if cursor is inside a link mark.
 */
function getLinkContext(view: EditorView): LinkContext | null {
  const { $from } = view.state.selection;
  const marks = $from.marks();
  const linkMark = marks.find((m) => m.type.name === "link");

  if (!linkMark) return null;

  // Find the full range of the link mark
  const parent = $from.parent;
  const parentStart = $from.start();
  const pos = $from.pos;

  let from = pos;
  let to = pos;

  // Scan backwards
  parent.forEach((child, offset) => {
    const childFrom = parentStart + offset;
    const childTo = childFrom + child.nodeSize;
    if (child.isText && linkMark.isInSet(child.marks) && childTo <= pos) {
      from = childFrom;
    }
  });

  // Find actual start by scanning
  parent.forEach((child, offset) => {
    const childFrom = parentStart + offset;
    const childTo = childFrom + child.nodeSize;
    if (child.isText && linkMark.isInSet(child.marks)) {
      if (childFrom < from && pos >= childFrom && pos <= childTo) {
        from = childFrom;
      }
    }
  });

  // Scan forward for end
  parent.forEach((child, offset) => {
    const childFrom = parentStart + offset;
    const childTo = childFrom + child.nodeSize;
    if (child.isText && linkMark.isInSet(child.marks)) {
      if (pos >= childFrom && pos <= childTo) {
        to = childTo;
      }
      if (childFrom >= pos && linkMark.isInSet(child.marks) && childFrom < to + 1) {
        to = Math.max(to, childTo);
      }
    }
  });

  // Recalculate properly - find contiguous range
  from = pos;
  to = pos;
  let foundStart = false;

  parent.forEach((child, offset) => {
    const childFrom = parentStart + offset;
    const childTo = childFrom + child.nodeSize;

    if (child.isText && linkMark.isInSet(child.marks)) {
      if (!foundStart) {
        from = childFrom;
        foundStart = true;
      }
      if (pos >= from && pos <= childTo) {
        // Continue extending while contiguous
        to = childTo;
      }
    } else if (foundStart && childFrom < pos) {
      // Reset if gap before cursor
      from = pos;
      to = pos;
      foundStart = false;
    }
  });

  // Final pass: find contiguous range containing pos
  from = -1;
  to = -1;
  let rangeStart = -1;
  let rangeEnd = -1;

  parent.forEach((child, offset) => {
    const childFrom = parentStart + offset;
    const childTo = childFrom + child.nodeSize;

    if (child.isText && linkMark.isInSet(child.marks)) {
      if (rangeStart === -1) {
        rangeStart = childFrom;
      }
      rangeEnd = childTo;
    } else {
      // Check if cursor was in accumulated range
      if (rangeStart !== -1 && pos >= rangeStart && pos <= rangeEnd) {
        from = rangeStart;
        to = rangeEnd;
      }
      rangeStart = -1;
      rangeEnd = -1;
    }
  });

  // Check final range
  if (rangeStart !== -1 && pos >= rangeStart && pos <= rangeEnd) {
    from = rangeStart;
    to = rangeEnd;
  }

  if (from === -1 || to === -1) return null;

  return {
    href: linkMark.attrs.href || "",
    text: view.state.doc.textBetween(from, to),
    from,
    to,
    contentFrom: from,
    contentTo: to,
  };
}

/**
 * Get image context if cursor is adjacent to an inline image.
 */
function getImageContext(view: EditorView): ImageContext | null {
  const { $from } = view.state.selection;
  const parent = $from.parent;
  const parentStart = $from.start();
  const pos = $from.pos;

  // Check nodes around cursor for image
  let imageInfo: ImageContext | null = null;

  parent.forEach((child, offset) => {
    const childFrom = parentStart + offset;
    const childTo = childFrom + child.nodeSize;

    if (child.type.name === "image" && pos >= childFrom && pos <= childTo) {
      imageInfo = {
        src: child.attrs.src || "",
        alt: child.attrs.alt || "",
        from: childFrom,
        to: childTo,
      };
    }
  });

  return imageInfo;
}

/**
 * Get inline math context if cursor is inside inline math.
 */
function getInlineMathContext(view: EditorView): InlineMathContext | null {
  const { $from } = view.state.selection;
  const parent = $from.parent;
  const parentStart = $from.start();
  const pos = $from.pos;

  let mathInfo: InlineMathContext | null = null;

  parent.forEach((child, offset) => {
    const childFrom = parentStart + offset;
    const childTo = childFrom + child.nodeSize;

    if (
      (child.type.name === "math_inline" || child.type.name === "inlineMath") &&
      pos >= childFrom &&
      pos <= childTo
    ) {
      mathInfo = {
        from: childFrom,
        to: childTo,
        contentFrom: childFrom + 1, // Skip opening $
        contentTo: childTo - 1, // Skip closing $
      };
    }
  });

  return mathInfo;
}

/**
 * Get footnote context if cursor is on a footnote reference.
 */
function getFootnoteContext(view: EditorView): FootnoteContext | null {
  const { $from } = view.state.selection;
  const parent = $from.parent;
  const parentStart = $from.start();
  const pos = $from.pos;

  let footnoteInfo: FootnoteContext | null = null;

  parent.forEach((child, offset) => {
    const childFrom = parentStart + offset;
    const childTo = childFrom + child.nodeSize;

    if (
      (child.type.name === "footnote_reference" ||
        child.type.name === "footnoteRef") &&
      pos >= childFrom &&
      pos <= childTo
    ) {
      footnoteInfo = {
        label: child.attrs.label || child.attrs.id || "",
        from: childFrom,
        to: childTo,
        contentFrom: childFrom,
        contentTo: childTo,
      };
    }
  });

  return footnoteInfo;
}

/**
 * Get innermost format range at cursor (for auto-selection).
 */
function getInnermostFormatRange(view: EditorView): FormattedRangeContext | null {
  const { $from, empty } = view.state.selection;

  // Only check when no selection
  if (!empty) return null;

  const pos = $from.pos;
  const result = findAnyMarkRangeAtCursor(pos, $from);

  if (!result) return null;

  // Determine the format type based on the mark
  const formatType: FormatType = result.isLink ? "link" : "bold"; // Default to bold for other marks

  return {
    type: formatType,
    from: result.from,
    to: result.to,
    contentFrom: result.from,
    contentTo: result.to,
  };
}

/**
 * Determine context mode.
 */
function getContextMode(view: EditorView): ContextMode {
  const { empty, $from } = view.state.selection;

  if (!empty) return "format";

  const wordRange = findWordAtCursor($from);
  if (wordRange) return "format";

  const atStart = $from.parentOffset === 0;
  const isEmpty = $from.parent.textContent.trim() === "";

  if (atStart && isEmpty) return "block-insert";

  return "inline-insert";
}

/**
 * Get active format marks at cursor.
 */
function getActiveFormats(view: EditorView): FormatType[] {
  const { $from } = view.state.selection;
  const marks = $from.marks();
  const formats: FormatType[] = [];

  for (const mark of marks) {
    switch (mark.type.name) {
      case "strong":
        formats.push("bold");
        break;
      case "emphasis":
      case "em":
        formats.push("italic");
        break;
      case "code_inline":
      case "code":
        formats.push("code");
        break;
      case "strike":
      case "strikethrough":
        formats.push("strikethrough");
        break;
      case "highlight":
        formats.push("highlight");
        break;
      case "link":
        formats.push("link");
        break;
      case "superscript":
        formats.push("superscript");
        break;
      case "subscript":
        formats.push("subscript");
        break;
    }
  }

  return formats;
}

/**
 * Compute full cursor context for Milkdown mode.
 */
export function computeMilkdownCursorContext(view: EditorView): CursorContext {
  const { from, to, empty } = view.state.selection;
  const $from = view.state.selection.$from;

  // Block contexts
  const inCodeBlock = getCodeBlockContext(view);
  const inHeading = getHeadingContext(view);
  const inList = getListContext(view);
  const inBlockquote = getBlockquoteContext(view);
  const inTable = getTableContext(view);

  // Inline contexts
  const inLink = getLinkContext(view);
  const inImage = getImageContext(view);
  const inInlineMath = getInlineMathContext(view);
  const inFootnote = getFootnoteContext(view);

  // Format marks
  const activeFormats = getActiveFormats(view);
  const innermostFormat = getInnermostFormatRange(view);

  // Position
  const atLineStart = isAtLineStart(view);
  const atBlankLine = isAtBlankLine(view);
  const wordRange = findWordAtCursor($from);
  const contextMode = getContextMode(view);

  // Boundaries
  const nearSpace = isNearSpace(view);
  const nearPunctuation = isNearPunctuation(view);

  return {
    // Block contexts
    inCodeBlock,
    inBlockMath: null, // Block math not applicable in Milkdown (different rendering)
    inTable,
    inList,
    inBlockquote,
    inHeading,

    // Inline contexts
    inLink,
    inImage,
    inInlineMath,
    inFootnote,

    // Format marks
    activeFormats,
    formatRanges: [], // Not applicable for ProseMirror (marks are stored in AST)
    innermostFormat,

    // Position
    atLineStart,
    atBlankLine,
    inWord: wordRange,
    contextMode,

    // Boundaries
    nearSpace,
    nearPunctuation,

    // Selection state
    hasSelection: !empty,
    selectionFrom: from,
    selectionTo: to,
  };
}
