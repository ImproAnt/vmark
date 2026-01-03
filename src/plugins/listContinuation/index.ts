/**
 * List Continuation Plugin
 *
 * Smart Enter behavior in lists:
 * - Enter on item with content → continue list (split item)
 * - Enter on empty item → exit list (lift item out)
 *
 * This matches the behavior in source mode.
 */

import { $prose } from "@milkdown/kit/utils";
import { keymap } from "@milkdown/kit/prose/keymap";
import { liftListItem, splitListItem } from "@milkdown/kit/prose/schema-list";
import type { EditorState, Transaction } from "@milkdown/kit/prose/state";
import type { EditorView } from "@milkdown/kit/prose/view";
import type { NodeType } from "@milkdown/kit/prose/model";

/**
 * Check if the list item content is empty (only contains whitespace).
 * Handles nested structures like paragraphs inside list items.
 */
function isListItemEmpty(state: EditorState, listItemType: NodeType): boolean {
  const { $from } = state.selection;

  // Find the list_item ancestor
  for (let d = $from.depth; d > 0; d--) {
    const node = $from.node(d);
    if (node.type === listItemType) {
      // Check if the entire list item content is empty
      return node.textContent.trim() === "";
    }
  }
  return false;
}

/**
 * Handle Enter key in lists.
 */
function handleListEnter(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
  _view?: EditorView
): boolean {
  const listItemType = state.schema.nodes["list_item"];
  if (!listItemType) return false;

  const { $from } = state.selection;

  // Check if we're inside a list_item
  let inListItem = false;
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type === listItemType) {
      inListItem = true;
      break;
    }
  }

  if (!inListItem) return false;

  // Check if the list item is empty
  if (isListItemEmpty(state, listItemType)) {
    // Empty item → exit list (lift)
    return liftListItem(listItemType)(state, dispatch);
  }

  // Item has content → split (continue list)
  // Task items: new item should have checked=false (splitListItem handles attrs)
  return splitListItem(listItemType)(state, dispatch);
}

/**
 * Milkdown plugin for smart list continuation.
 * Must be registered BEFORE commonmark preset to override default Enter.
 */
export const listContinuationPlugin = $prose(() =>
  keymap({
    Enter: handleListEnter,
  })
);

export default listContinuationPlugin;
