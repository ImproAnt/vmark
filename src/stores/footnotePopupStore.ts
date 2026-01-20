/**
 * Footnote Popup Store
 *
 * Manages the state for the footnote hover popup.
 */

import { create } from "zustand";

interface FootnotePopupState {
  isOpen: boolean;
  label: string;
  content: string;
  anchorRect: DOMRect | null;
  /** Position of the footnote definition in the document */
  definitionPos: number | null;
  /** Position of the footnote reference in the document */
  referencePos: number | null;
  /** When true, auto-focus textarea (for new footnote) */
  autoFocus: boolean;
}

interface FootnotePopupActions {
  openPopup: (
    label: string,
    content: string,
    anchorRect: DOMRect,
    definitionPos: number | null,
    referencePos: number | null,
    autoFocus?: boolean
  ) => void;
  setContent: (content: string) => void;
  closePopup: () => void;
}

export const useFootnotePopupStore = create<FootnotePopupState & FootnotePopupActions>(
  (set) => ({
    isOpen: false,
    label: "",
    content: "",
    anchorRect: null,
    definitionPos: null,
    referencePos: null,
    autoFocus: false,

    openPopup: (label, content, anchorRect, definitionPos, referencePos, autoFocus = false) =>
      set({ isOpen: true, label, content, anchorRect, definitionPos, referencePos, autoFocus }),

    setContent: (content) => set({ content }),

    closePopup: () =>
      set({ isOpen: false, label: "", content: "", anchorRect: null, definitionPos: null, referencePos: null, autoFocus: false }),
  })
);
