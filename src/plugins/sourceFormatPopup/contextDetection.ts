/**
 * Context Detection for Source Mode Format Popup
 *
 * Determines which toolbar mode to show based on cursor position.
 * Handles Cmd+E keyboard shortcut by routing to appropriate popup.
 */

import type { EditorView } from "@codemirror/view";
import { useSourceFormatStore } from "@/stores/sourceFormatStore";
import { getSourceTableInfo } from "./tableDetection";
import { getHeadingInfo } from "./headingDetection";
import { getCodeFenceInfo } from "./codeFenceDetection";
import { getWordAtCursor } from "./wordSelection";
import { isAtParagraphLineStart } from "./paragraphDetection";
import { getBlockMathInfo } from "./blockMathDetection";
import { getListItemInfo } from "./listDetection";
import { getBlockquoteInfo } from "./blockquoteDetection";
import { getInlineElementAtCursor } from "./inlineDetection";
import { getSelectionRect, getCursorRect, getContextModeSource } from "./positionUtils";

// Re-export for backward compatibility
export { getSelectionRect, getCursorRect, getContextModeSource } from "./positionUtils";

/**
 * Toggle table popup visibility. Called via keyboard shortcut.
 * Shows table popup if cursor is in a table, otherwise does nothing.
 */
export function toggleTablePopup(view: EditorView): boolean {
  const store = useSourceFormatStore.getState();

  // If table popup is already open, close it
  if (store.isOpen && store.mode === "table") {
    store.closePopup();
    return true;
  }

  // Check if cursor is in a table
  const tableInfo = getSourceTableInfo(view);
  if (!tableInfo) {
    return false; // Not in table, don't consume the key
  }

  // Show table popup
  const { from } = view.state.selection.main;
  const rect = getCursorRect(view, from);
  if (!rect) return false;

  store.openTablePopup({
    anchorRect: rect,
    editorView: view,
    tableInfo,
  });

  return true;
}

/**
 * Trigger format popup at cursor position via keyboard shortcut.
 * Shows context-aware popup based on cursor location following priority order:
 * 1. Toggle if already open
 * 2. Code fence → CODE toolbar
 * 3. Block math → MATH toolbar
 * 4. Table → TABLE toolbar (merged)
 * 5. List → LIST toolbar (merged)
 * 6. Blockquote → BLOCKQUOTE toolbar (merged)
 * 7. Has selection → FORMAT toolbar
 * 8-11. Inline elements (link, image, math, footnote)
 * 12-13. Heading or paragraph line start → HEADING toolbar
 * 14-15. Formatted range or word → FORMAT toolbar (auto-select)
 * 16-17. Blank line or otherwise → INSERT toolbar
 */
export function triggerFormatPopup(view: EditorView): boolean {
  const store = useSourceFormatStore.getState();
  const { from, to } = view.state.selection.main;
  const hasSelection = from !== to;

  // 1. Toggle: if popup is already open, close it
  if (store.isOpen) {
    store.closePopup();
    return true;
  }

  // 2. Code fence → CODE toolbar
  const codeFenceInfo = getCodeFenceInfo(view);
  if (codeFenceInfo) {
    const rect = getCursorRect(view, from);
    if (!rect) return false;

    store.openCodePopup({
      anchorRect: rect,
      editorView: view,
      codeFenceInfo,
    });
    return true;
  }

  // 3. Block math ($$...$$) → MATH toolbar
  const blockMathInfo = getBlockMathInfo(view);
  if (blockMathInfo) {
    const rect = getCursorRect(view, from);
    if (!rect) return false;

    store.openMathPopup({
      anchorRect: rect,
      editorView: view,
      blockMathInfo,
    });
    return true;
  }

  // 4. Table → TABLE toolbar (merged with format)
  const tableInfo = getSourceTableInfo(view);
  if (tableInfo) {
    const rect = getCursorRect(view, from);
    if (!rect) return false;

    store.openTablePopup({
      anchorRect: rect,
      editorView: view,
      tableInfo,
    });
    return true;
  }

  // 5. List → LIST toolbar (merged with format)
  const listInfo = getListItemInfo(view);
  if (listInfo) {
    const rect = getCursorRect(view, from);
    if (!rect) return false;

    store.openListPopup({
      anchorRect: rect,
      editorView: view,
      listInfo,
    });
    return true;
  }

  // 6. Blockquote → BLOCKQUOTE toolbar (merged with format)
  const blockquoteInfo = getBlockquoteInfo(view);
  if (blockquoteInfo) {
    const rect = getCursorRect(view, from);
    if (!rect) return false;

    store.openBlockquotePopup({
      anchorRect: rect,
      editorView: view,
      blockquoteInfo,
    });
    return true;
  }

  // 7. Has selection → FORMAT toolbar (honor user's selection)
  if (hasSelection) {
    const rect = getSelectionRect(view, from, to);
    if (!rect) return false;

    const selectedText = view.state.doc.sliceString(from, to);
    store.openPopup({
      anchorRect: rect,
      selectedText,
      editorView: view,
      contextMode: "format",
    });
    return true;
  }

  // 8-11. Check inline elements (link, image, math, footnote)
  const inlineElement = getInlineElementAtCursor(view);
  if (inlineElement) {
    // 9. Image → Do nothing (has own popup on click)
    if (inlineElement.type === "image") {
      return false;
    }

    // 11. Footnote → FOOTNOTE toolbar
    if (inlineElement.type === "footnote") {
      const rect = getSelectionRect(view, inlineElement.from, inlineElement.to);
      if (!rect) return false;

      // Auto-select the footnote reference
      view.dispatch({
        selection: { anchor: inlineElement.contentFrom, head: inlineElement.contentTo },
      });

      store.openFootnotePopup({
        anchorRect: rect,
        editorView: view,
      });
      return true;
    }

    // 8, 10. Link or inline math → FORMAT toolbar (auto-select content)
    const rect = getSelectionRect(view, inlineElement.contentFrom, inlineElement.contentTo);
    if (!rect) return false;

    // Auto-select the content
    view.dispatch({
      selection: { anchor: inlineElement.contentFrom, head: inlineElement.contentTo },
    });

    const selectedText = view.state.doc.sliceString(
      inlineElement.contentFrom,
      inlineElement.contentTo
    );
    store.openPopup({
      anchorRect: rect,
      selectedText,
      editorView: view,
      contextMode: "format",
    });
    return true;
  }

  // 12. Heading → HEADING toolbar
  const headingInfo = getHeadingInfo(view);
  if (headingInfo) {
    const rect = getCursorRect(view, from);
    if (!rect) return false;

    store.openHeadingPopup({
      anchorRect: rect,
      editorView: view,
      headingInfo,
    });
    return true;
  }

  // 13. Cursor at paragraph line start → HEADING toolbar
  if (isAtParagraphLineStart(view)) {
    const rect = getCursorRect(view, from);
    if (!rect) return false;

    const line = view.state.doc.lineAt(from);
    store.openHeadingPopup({
      anchorRect: rect,
      editorView: view,
      headingInfo: {
        level: 0, // paragraph
        lineStart: line.from,
        lineEnd: line.to,
      },
    });
    return true;
  }

  // 14-15. Cursor in word → FORMAT toolbar (auto-select word)
  const wordRange = getWordAtCursor(view);
  if (wordRange) {
    const rect = getSelectionRect(view, wordRange.from, wordRange.to);
    if (!rect) return false;

    // Auto-select the word
    view.dispatch({
      selection: { anchor: wordRange.from, head: wordRange.to },
    });

    const selectedText = view.state.doc.sliceString(wordRange.from, wordRange.to);
    store.openPopup({
      anchorRect: rect,
      selectedText,
      editorView: view,
      contextMode: "format",
    });
    return true;
  }

  // 16-17. Blank line or otherwise → INSERT toolbar
  const contextMode = getContextModeSource(view);
  const rect = getCursorRect(view, from);
  if (!rect) return false;

  store.openPopup({
    anchorRect: rect,
    selectedText: "",
    editorView: view,
    contextMode,
  });

  return true;
}
