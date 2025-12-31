/**
 * Footnote Popup Utilities
 *
 * Shared utility functions for the footnote popup plugin.
 */

import type { EditorView } from "@milkdown/kit/prose/view";

/**
 * Scroll the editor to bring a position into view.
 * Scrolls with smooth animation and leaves some space at the top.
 */
export function scrollToPosition(view: EditorView, pos: number) {
  const coords = view.coordsAtPos(pos);
  if (coords) {
    const editorContent = document.querySelector(".editor-content");
    if (editorContent) {
      const editorRect = editorContent.getBoundingClientRect();
      const scrollTop = coords.top - editorRect.top + editorContent.scrollTop - 100;
      editorContent.scrollTo({ top: scrollTop, behavior: "smooth" });
    }
  }
}
