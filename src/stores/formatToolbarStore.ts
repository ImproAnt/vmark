/**
 * Format Toolbar Store
 *
 * Manages the visibility and position of the format toolbar
 * in Milkdown WYSIWYG mode. Supports multiple modes:
 * - format: inline formatting (bold, italic, etc.)
 * - heading: heading level selection (H1-H6, paragraph)
 */

import { create } from "zustand";
import type { AnchorRect } from "@/utils/popupPosition";
import type { EditorView } from "@milkdown/kit/prose/view";

export type ToolbarMode = "format" | "heading";

export interface HeadingInfo {
  level: number; // 1-6, or 0 for paragraph
  nodePos: number; // Position of the heading node
}

interface FormatToolbarState {
  isOpen: boolean;
  mode: ToolbarMode;
  anchorRect: AnchorRect | null;
  editorView: EditorView | null;
  headingInfo: HeadingInfo | null;
}

interface FormatToolbarActions {
  openToolbar: (rect: AnchorRect, view: EditorView) => void;
  openHeadingToolbar: (rect: AnchorRect, view: EditorView, headingInfo: HeadingInfo) => void;
  closeToolbar: () => void;
  updatePosition: (rect: AnchorRect) => void;
}

const initialState: FormatToolbarState = {
  isOpen: false,
  mode: "format",
  anchorRect: null,
  editorView: null,
  headingInfo: null,
};

export const useFormatToolbarStore = create<FormatToolbarState & FormatToolbarActions>(
  (set) => ({
    ...initialState,

    openToolbar: (rect, view) =>
      set({
        isOpen: true,
        mode: "format",
        anchorRect: rect,
        editorView: view,
        headingInfo: null,
      }),

    openHeadingToolbar: (rect, view, headingInfo) =>
      set({
        isOpen: true,
        mode: "heading",
        anchorRect: rect,
        editorView: view,
        headingInfo,
      }),

    closeToolbar: () => set(initialState),

    updatePosition: (rect) => set({ anchorRect: rect }),
  })
);
