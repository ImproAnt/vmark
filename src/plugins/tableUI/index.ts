/**
 * Table UI Plugin
 *
 * Provides visual table editing with floating toolbar.
 * Shows toolbar when cursor is in table, allows row/column operations.
 */

import { $prose } from "@milkdown/kit/utils";
import { Plugin, PluginKey, PluginView } from "@milkdown/kit/prose/state";
import type { EditorView } from "@milkdown/kit/prose/view";
import type { Ctx } from "@milkdown/kit/ctx";
import { editorViewCtx } from "@milkdown/kit/core";
import { useTableToolbarStore } from "@/stores/tableToolbarStore";
import { TableToolbarView } from "./TableToolbarView";
import { TableContextMenu } from "./TableContextMenu";
import { ColumnResizeManager } from "./columnResize";
import { createTableKeymapCommands } from "./tableKeymap";
import { isInTable, getTableInfo, getTableRect } from "./table-utils";

export const tableUIPluginKey = new PluginKey("tableUI");

/**
 * Update toolbar state based on current selection.
 */
function updateToolbarState(view: EditorView) {
  const store = useTableToolbarStore.getState();

  if (isInTable(view)) {
    const info = getTableInfo(view);
    if (info) {
      const rect = getTableRect(view, info.tablePos);
      if (rect) {
        if (store.isOpen && store.tablePos === info.tablePos) {
          // Just update position
          store.updatePosition(rect);
        } else {
          // Open toolbar for new table
          store.openToolbar({
            tablePos: info.tablePos,
            anchorRect: rect,
          });
        }
        return;
      }
    }
  }

  // Not in table or couldn't get info - close toolbar
  if (store.isOpen) {
    store.closeToolbar();
  }
}

// Editor getter type
type EditorGetter = () => { action: (fn: (ctx: Ctx) => void) => void } | undefined;

// Store context menu reference for handleDOMEvents access
let activeContextMenu: TableContextMenu | null = null;

/**
 * Plugin view that manages TableToolbarView, TableContextMenu, and ColumnResizeManager.
 */
class TableUIPluginView implements PluginView {
  private toolbarView: TableToolbarView;
  private contextMenu: TableContextMenu;
  private columnResize: ColumnResizeManager;

  constructor(view: EditorView, ctx: Ctx) {
    // Create editor getter that wraps context for command execution
    const getEditor: EditorGetter = () => {
      try {
        // Verify context is still valid
        ctx.get(editorViewCtx);
        // Return wrapper for command execution
        return {
          action: (fn: (ctx: Ctx) => void) => fn(ctx),
        };
      } catch {
        return undefined;
      }
    };

    this.toolbarView = new TableToolbarView(view, getEditor);
    this.contextMenu = new TableContextMenu(view, getEditor);
    this.columnResize = new ColumnResizeManager(view);

    // Store reference for handleDOMEvents
    activeContextMenu = this.contextMenu;

    // Initial state check
    updateToolbarState(view);
  }

  update(view: EditorView) {
    updateToolbarState(view);
    // Update column resize handles when content changes
    this.columnResize.updateHandles();
  }

  destroy() {
    this.toolbarView.destroy();
    this.contextMenu.destroy();
    this.columnResize.destroy();
    activeContextMenu = null;
    useTableToolbarStore.getState().closeToolbar();
  }
}

/**
 * Table UI plugin for Milkdown.
 */
export const tableUIPlugin = $prose((ctx) => {
  return new Plugin({
    key: tableUIPluginKey,
    view(editorView) {
      return new TableUIPluginView(editorView, ctx);
    },
    props: {
      handleDOMEvents: {
        // Show context menu on right-click in table
        contextmenu: (view, event) => {
          if (!isInTable(view)) return false;

          // Prevent default context menu
          event.preventDefault();

          // Show our context menu at click position
          if (activeContextMenu) {
            activeContextMenu.show(event.clientX, event.clientY);
          }

          return true;
        },
        // Close toolbar when clicking outside editor
        blur: () => {
          // Delay to allow button clicks to register first
          setTimeout(() => {
            const active = document.activeElement;
            if (!active?.closest(".table-toolbar") && !active?.closest(".table-context-menu")) {
              useTableToolbarStore.getState().closeToolbar();
            }
          }, 100);
          return false;
        },
      },
    },
  });
});

/**
 * Table keyboard navigation plugin.
 */
export const tableKeymapPlugin = $prose((ctx) => {
  return createTableKeymapCommands(ctx);
});

export default tableUIPlugin;
