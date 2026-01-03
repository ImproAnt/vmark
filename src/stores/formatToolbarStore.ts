/**
 * Format Toolbar Store
 *
 * Manages the visibility and position of the format toolbar
 * in Milkdown WYSIWYG mode.
 */

import { create } from "zustand";
import type { AnchorRect } from "@/utils/popupPosition";
import type { EditorView } from "@milkdown/kit/prose/view";

interface FormatToolbarState {
  isOpen: boolean;
  anchorRect: AnchorRect | null;
  editorView: EditorView | null;
}

interface FormatToolbarActions {
  openToolbar: (rect: AnchorRect, view: EditorView) => void;
  closeToolbar: () => void;
  updatePosition: (rect: AnchorRect) => void;
}

const initialState: FormatToolbarState = {
  isOpen: false,
  anchorRect: null,
  editorView: null,
};

export const useFormatToolbarStore = create<FormatToolbarState & FormatToolbarActions>(
  (set) => ({
    ...initialState,

    openToolbar: (rect, view) =>
      set({
        isOpen: true,
        anchorRect: rect,
        editorView: view,
      }),

    closeToolbar: () =>
      set({
        isOpen: false,
        anchorRect: null,
        editorView: null,
      }),

    updatePosition: (rect) =>
      set({ anchorRect: rect }),
  })
);
