/**
 * Tab Indent Extension for Tiptap
 *
 * Fallback Tab handler that inserts spaces when Tab is not handled
 * by other extensions (slash menu, auto-pair jump, list indent, etc.).
 *
 * When cursor is in a table:
 * - Tab: moves to next cell, or adds a row at the last cell
 * - Shift+Tab: moves to previous cell
 *
 * This prevents Tab from moving focus outside the editor.
 */

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { goToNextCell, addRowAfter } from "@tiptap/pm/tables";
import { useSettingsStore } from "@/stores/settingsStore";
import { isInTable, getTableInfo } from "@/plugins/tableUI/tableActions.tiptap";

const tabIndentPluginKey = new PluginKey("tabIndent");

/**
 * Get the configured tab size (number of spaces).
 */
function getTabSize(): number {
  return useSettingsStore.getState().general.tabSize;
}

export const tabIndentExtension = Extension.create({
  name: "tabIndent",
  // Low priority - runs after all other Tab handlers
  priority: 50,

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: tabIndentPluginKey,
        props: {
          handleDOMEvents: {
            keydown: (view, event) => {
              // Skip if not Tab or has modifiers (except Shift)
              if (event.key !== "Tab") return false;
              if (event.ctrlKey || event.altKey || event.metaKey) return false;

              // Skip IME composition
              if (event.isComposing || event.keyCode === 229) return false;

              // In table: delegate to table cell navigation
              if (isInTable(view)) {
                event.preventDefault();
                const direction = event.shiftKey ? -1 : 1;
                const moved = goToNextCell(direction)(view.state, view.dispatch, view);

                // If Tab (not Shift+Tab) couldn't move, we're at last cell - add new row
                if (!moved && direction === 1) {
                  const info = getTableInfo(view);
                  if (info && info.rowIndex === info.numRows - 1 && info.colIndex === info.numCols - 1) {
                    // Add row below, then move to first cell of new row
                    addRowAfter(view.state, view.dispatch);
                    // After adding row, move to first cell
                    goToNextCell(1)(view.state, view.dispatch, view);
                  }
                }
                return true;
              }

              const { state, dispatch } = view;
              const { selection } = state;

              // Handle Shift+Tab: outdent (remove up to tabSize spaces before cursor)
              if (event.shiftKey) {
                event.preventDefault();
                const { from } = selection;
                const $from = state.doc.resolve(from);
                const lineStart = $from.start();
                const textBefore = state.doc.textBetween(lineStart, from, "\n");

                // Count leading spaces
                const leadingSpaces = textBefore.match(/^[ ]*/)?.[0].length ?? 0;
                if (leadingSpaces === 0) return true;

                // Remove up to tabSize spaces
                const spacesToRemove = Math.min(leadingSpaces, getTabSize());
                const tr = state.tr.delete(lineStart, lineStart + spacesToRemove);
                dispatch(tr);
                return true;
              }

              // Handle Tab: insert spaces
              event.preventDefault();
              const spaces = " ".repeat(getTabSize());

              // If there's a selection, replace it with spaces
              if (!selection.empty) {
                const tr = state.tr.replaceSelectionWith(
                  state.schema.text(spaces),
                  true
                );
                dispatch(tr);
                return true;
              }

              // Insert spaces at cursor
              const tr = state.tr.insertText(spaces);
              dispatch(tr);
              return true;
            },
          },
        },
      }),
    ];
  },
});
