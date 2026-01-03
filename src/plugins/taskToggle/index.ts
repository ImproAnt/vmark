/**
 * Task Toggle Plugin
 *
 * Cmd+Shift+Enter toggles task checkbox state:
 * - [ ] ↔ [x]
 * - Plain list item → task item with [ ]
 */

import { $prose } from "@milkdown/kit/utils";
import { keymap } from "@milkdown/kit/prose/keymap";
import type { EditorState } from "@milkdown/kit/prose/state";
import type { EditorView } from "@milkdown/kit/prose/view";

/**
 * Find list_item node at cursor position.
 * Returns the position and node if found.
 */
function findListItemAtCursor(
  state: EditorState
): { pos: number; node: ReturnType<typeof state.doc.nodeAt> } | null {
  const { $from } = state.selection;
  const listItemType = state.schema.nodes["list_item"];
  if (!listItemType) return null;

  for (let d = $from.depth; d > 0; d--) {
    const node = $from.node(d);
    if (node.type === listItemType) {
      return { pos: $from.before(d), node };
    }
  }
  return null;
}

/**
 * Toggle task checkbox on the current list item.
 */
function toggleTaskCheckbox(
  state: EditorState,
  dispatch?: EditorView["dispatch"]
): boolean {
  const listItemInfo = findListItemAtCursor(state);
  if (!listItemInfo) return false;

  const { pos, node } = listItemInfo;
  if (!node) return false;

  const checked = node.attrs.checked;

  if (checked === null || checked === undefined) {
    // Not a task item → convert to task (unchecked)
    dispatch?.(
      state.tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        checked: false,
      })
    );
  } else {
    // Toggle checked state
    dispatch?.(
      state.tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        checked: !checked,
      })
    );
  }

  return true;
}

/**
 * Milkdown plugin for task toggle keyboard shortcut.
 */
export const taskTogglePlugin = $prose(() =>
  keymap({
    "Mod-Shift-Enter": toggleTaskCheckbox,
  })
);

export default taskTogglePlugin;
