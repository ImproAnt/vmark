/**
 * Source Format Popup Extension for CodeMirror
 *
 * Detects text selection and shows/hides the formatting popup.
 * Table popup is shown via keyboard shortcut, not automatically.
 * Uses debounce to avoid flicker during rapid selection changes.
 */

import { EditorView } from "@codemirror/view";
import { useSourceFormatStore } from "@/stores/sourceFormatStore";
import { getSourceTableInfo } from "./tableDetection";
import { getHeadingInfo } from "./headingDetection";

// Debounce timeout for showing popup
let showTimeout: ReturnType<typeof setTimeout> | null = null;

// Minimum selection length to show popup
const MIN_SELECTION_LENGTH = 1;

// Delay before showing popup (ms)
const SHOW_DELAY = 200;

/**
 * Check if position is inside a code fence (``` ... ```).
 */
function isInCodeFence(view: EditorView, pos: number): boolean {
  const doc = view.state.doc.toString();
  const lines = doc.split("\n");

  let currentPos = 0;
  let inCodeFence = false;

  for (const line of lines) {
    const lineEnd = currentPos + line.length;

    // Check if this line starts/ends a code fence
    if (line.trimStart().startsWith("```")) {
      if (pos >= currentPos && pos <= lineEnd) {
        // Cursor is on a fence line - consider it inside
        return true;
      }
      inCodeFence = !inCodeFence;
    } else if (inCodeFence && pos >= currentPos && pos <= lineEnd) {
      return true;
    }

    currentPos = lineEnd + 1; // +1 for newline
  }

  return false;
}

/**
 * Clear any pending show timeout.
 */
function clearShowTimeout() {
  if (showTimeout) {
    clearTimeout(showTimeout);
    showTimeout = null;
  }
}

/**
 * Get the bounding rect for a selection range.
 */
function getSelectionRect(view: EditorView, from: number, to: number) {
  const fromCoords = view.coordsAtPos(from);
  const toCoords = view.coordsAtPos(to);

  if (!fromCoords || !toCoords) return null;

  return {
    top: Math.min(fromCoords.top, toCoords.top),
    left: Math.min(fromCoords.left, toCoords.left),
    bottom: Math.max(fromCoords.bottom, toCoords.bottom),
    right: Math.max(fromCoords.right, toCoords.right),
  };
}

/**
 * Get the bounding rect for current cursor position.
 */
function getCursorRect(view: EditorView, pos: number) {
  const coords = view.coordsAtPos(pos);
  if (!coords) return null;

  return {
    top: coords.top,
    left: coords.left,
    bottom: coords.bottom,
    right: coords.right,
  };
}

/**
 * CodeMirror extension that monitors selection and manages popup visibility.
 */
export const sourceFormatExtension = EditorView.updateListener.of((update) => {
  // Only handle selection changes
  if (!update.selectionSet) return;

  const { from, to } = update.view.state.selection.main;
  const hasSelection = to - from >= MIN_SELECTION_LENGTH;

  if (hasSelection) {
    // Clear any pending timeout
    clearShowTimeout();

    // Schedule popup show with delay
    showTimeout = setTimeout(() => {
      // Re-check selection (might have changed during delay)
      const currentSelection = update.view.state.selection.main;
      const currentFrom = currentSelection.from;
      const currentTo = currentSelection.to;

      if (currentTo - currentFrom < MIN_SELECTION_LENGTH) {
        // No selection - close popup (table popup is triggered by shortcut)
        useSourceFormatStore.getState().closePopup();
        return;
      }

      // Don't show popup if selection is in a code fence
      if (isInCodeFence(update.view, currentFrom) || isInCodeFence(update.view, currentTo)) {
        useSourceFormatStore.getState().closePopup();
        return;
      }

      const rect = getSelectionRect(update.view, currentFrom, currentTo);
      if (!rect) return;

      // Check if selection is in a heading
      const headingInfo = getHeadingInfo(update.view);
      if (headingInfo) {
        useSourceFormatStore.getState().openHeadingPopup({
          anchorRect: rect,
          editorView: update.view,
          headingInfo,
        });
        return;
      }

      // Regular text selection - show format popup
      const selectedText = update.view.state.doc.sliceString(currentFrom, currentTo);

      useSourceFormatStore.getState().openPopup({
        anchorRect: rect,
        selectedText,
        editorView: update.view,
      });
    }, SHOW_DELAY);
  } else {
    // No selection - close popup (table popup is triggered by shortcut)
    clearShowTimeout();
    useSourceFormatStore.getState().closePopup();
  }
});

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

// Re-export components
export { SourceFormatPopup } from "./SourceFormatPopup";
export { applyFormat, hasFormat, type FormatType } from "./formatActions";
