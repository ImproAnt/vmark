/**
 * Node Detection for Milkdown Format Toolbar
 *
 * Detects various node types at cursor position for context-aware toolbar.
 */

import type { EditorView } from "@milkdown/kit/prose/view";
import type { HeadingInfo, ContextMode, CodeBlockInfo } from "@/stores/formatToolbarStore";
import { findWordAtCursor } from "@/plugins/syntaxReveal/marks";

/**
 * Get code block info if cursor is inside a code block node.
 * Returns null if not in a code block.
 */
export function getCodeBlockInfo(view: EditorView): CodeBlockInfo | null {
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
 * Returns null if not in a heading.
 */
export function getHeadingInfo(view: EditorView): HeadingInfo | null {
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
 * Check if cursor is inside a list node (bullet_list, ordered_list, task_list_item).
 */
export function isInList(view: EditorView): boolean {
  const { $from } = view.state.selection;
  for (let d = $from.depth; d > 0; d--) {
    const node = $from.node(d);
    const name = node.type.name;
    if (name === "bullet_list" || name === "ordered_list" || name === "list_item") {
      return true;
    }
  }
  return false;
}

/**
 * Check if cursor is inside a blockquote node.
 */
export function isInBlockquote(view: EditorView): boolean {
  const { $from } = view.state.selection;
  for (let d = $from.depth; d > 0; d--) {
    const node = $from.node(d);
    if (node.type.name === "blockquote") {
      return true;
    }
  }
  return false;
}

/**
 * Check if cursor is at the start of a paragraph (not heading, list, blockquote, etc.)
 * For showing heading toolbar to convert paragraph to heading.
 */
export function isAtParagraphLineStart(view: EditorView): boolean {
  const { $from } = view.state.selection;

  // Must be at start of text (offset 0 or only whitespace before)
  if ($from.parentOffset !== 0) {
    // Check if all text before cursor is whitespace
    const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
    if (textBefore.trim() !== "") {
      return false;
    }
  }

  // Parent must be a paragraph
  if ($from.parent.type.name !== "paragraph") {
    return false;
  }

  // Paragraph must not be empty (those show block-insert toolbar)
  if ($from.parent.textContent.trim() === "") {
    return false;
  }

  // Not in special containers (list, blockquote, table, code)
  for (let d = $from.depth - 1; d > 0; d--) {
    const ancestor = $from.node(d);
    const name = ancestor.type.name;
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
 * Get cursor rect for positioning toolbar.
 */
export function getCursorRect(view: EditorView) {
  const { from, to } = view.state.selection;
  const start = view.coordsAtPos(from);
  const end = view.coordsAtPos(to);

  return {
    top: Math.min(start.top, end.top),
    bottom: Math.max(start.bottom, end.bottom),
    left: Math.min(start.left, end.left),
    right: Math.max(start.right, end.right),
    width: Math.abs(end.left - start.left),
    height: Math.abs(end.bottom - start.top),
  };
}

/**
 * Determine context mode based on cursor position.
 * - "format": text selected OR cursor in word
 * - "inline-insert": cursor not in word, not at blank line
 * - "block-insert": cursor at beginning of blank line
 */
export function getContextMode(view: EditorView): ContextMode {
  const { empty } = view.state.selection;

  // Has selection → format
  if (!empty) return "format";

  // Check if cursor in word
  const $from = view.state.selection.$from;
  const wordRange = findWordAtCursor($from);
  if (wordRange) return "format";

  // Check if at blank line start
  const parent = $from.parent;
  const atStart = $from.parentOffset === 0;
  const isEmpty = parent.textContent.trim() === "";

  if (atStart && isEmpty) return "block-insert";

  return "inline-insert";
}
