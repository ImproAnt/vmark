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

/**
 * Plugin state interface for storing context menu reference.
 */
interface TableUIPluginState {
  contextMenu: TableContextMenu | null;
}

export const tableUIPluginKey = new PluginKey<TableUIPluginState>("tableUI");

/**
 * Update toolbar state based on current selection.
 *
 * IMPORTANT: We must check isInTable() BEFORE calling getTableInfo()/getTableRect().
 * These functions call view.domAtPos() which can trigger browser scroll when
 * querying positions of off-screen tables. Early exit prevents scroll jumps.
 */
function updateToolbarState(view: EditorView): boolean {
  const store = useTableToolbarStore.getState();

  // Early exit if not in table - avoid querying table positions which can cause scroll
  if (!isInTable(view)) {
    if (store.isOpen) {
      store.closeToolbar();
    }
    return false;
  }

  // Cursor is in table - only update position if toolbar already open
  // (toolbar is opened via Cmd+E, not automatically)
  if (store.isOpen) {
    const info = getTableInfo(view);
    if (info) {
      const rect = getTableRect(view, info.tablePos);
      if (rect) {
        store.updatePosition(rect);
      }
    } else {
      // Couldn't get table info - close toolbar
      store.closeToolbar();
    }
  }

  return true; // In table
}

// Editor getter type
type EditorGetter = () => { action: (fn: (ctx: Ctx) => void) => void } | undefined;

/**
 * Plugin view that manages TableToolbarView, TableContextMenu, and ColumnResizeManager.
 */
class TableUIPluginView implements PluginView {
  private toolbarView: TableToolbarView;
  private contextMenu: TableContextMenu;
  private columnResize: ColumnResizeManager;
  private view: EditorView;

  constructor(view: EditorView, ctx: Ctx) {
    this.view = view;

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

    // Store context menu in plugin state via transaction
    const tr = view.state.tr.setMeta(tableUIPluginKey, { contextMenu: this.contextMenu });
    view.dispatch(tr);

    // Initial state check
    updateToolbarState(view);
  }

  update(view: EditorView) {
    const inTable = updateToolbarState(view);
    // Only update resize handles when cursor is in table - avoids querying
    // off-screen table positions which can trigger unwanted scroll
    if (inTable) {
      this.columnResize.scheduleUpdate();
    }
  }

  destroy() {
    this.toolbarView.destroy();
    this.contextMenu.destroy();
    this.columnResize.destroy();

    // Clear plugin state
    const tr = this.view.state.tr.setMeta(tableUIPluginKey, { contextMenu: null });
    // Only dispatch if view is still valid
    try {
      this.view.dispatch(tr);
    } catch {
      // View may already be destroyed
    }

    useTableToolbarStore.getState().closeToolbar();
  }
}

/**
 * Table UI plugin for Milkdown.
 */
export const tableUIPlugin = $prose((ctx) => {
  return new Plugin<TableUIPluginState>({
    key: tableUIPluginKey,
    state: {
      init: () => ({ contextMenu: null }),
      apply: (tr, value) => {
        const meta = tr.getMeta(tableUIPluginKey);
        if (meta) {
          return { ...value, ...meta };
        }
        return value;
      },
    },
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

          // Get context menu from plugin state
          const pluginState = tableUIPluginKey.getState(view.state);
          if (pluginState?.contextMenu) {
            pluginState.contextMenu.show(event.clientX, event.clientY);
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
