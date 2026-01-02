/**
 * Table Toolbar Store
 *
 * Manages state for the table editing toolbar that appears when cursor is in a table.
 */

import { create } from "zustand";

interface AnchorRect {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

interface TableToolbarState {
  isOpen: boolean;
  tablePos: number;
  anchorRect: AnchorRect | null;
}

interface TableToolbarActions {
  openToolbar: (data: { tablePos: number; anchorRect: AnchorRect }) => void;
  closeToolbar: () => void;
  updatePosition: (anchorRect: AnchorRect) => void;
}

type TableToolbarStore = TableToolbarState & TableToolbarActions;

const initialState: TableToolbarState = {
  isOpen: false,
  tablePos: 0,
  anchorRect: null,
};

export const useTableToolbarStore = create<TableToolbarStore>((set) => ({
  ...initialState,

  openToolbar: (data) =>
    set({
      isOpen: true,
      tablePos: data.tablePos,
      anchorRect: data.anchorRect,
    }),

  closeToolbar: () => set(initialState),

  updatePosition: (anchorRect) => set({ anchorRect }),
}));
