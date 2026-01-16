/**
 * Heading Picker Store
 *
 * Manages state for the heading picker that appears when inserting bookmark links.
 * User selects a heading to create a link like [text](#heading-id).
 */

import { create } from "zustand";
import type { HeadingWithId } from "@/utils/headingSlug";

type OnSelectCallback = (id: string, text: string) => void;

interface HeadingPickerState {
  isOpen: boolean;
  headings: HeadingWithId[];
  onSelect: OnSelectCallback | null;
}

interface HeadingPickerActions {
  openPicker: (headings: HeadingWithId[], onSelect: OnSelectCallback) => void;
  closePicker: () => void;
  selectHeading: (heading: HeadingWithId) => void;
}

type HeadingPickerStore = HeadingPickerState & HeadingPickerActions;

const initialState: HeadingPickerState = {
  isOpen: false,
  headings: [],
  onSelect: null,
};

export const useHeadingPickerStore = create<HeadingPickerStore>((set, get) => ({
  ...initialState,

  openPicker: (headings, onSelect) =>
    set({
      isOpen: true,
      headings,
      onSelect,
    }),

  closePicker: () => set(initialState),

  selectHeading: (heading) => {
    const { onSelect } = get();
    if (onSelect) {
      onSelect(heading.id, heading.text);
    }
    set(initialState);
  },
}));
