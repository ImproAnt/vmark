/**
 * Blockquote Toggle Plugin
 *
 * True toggle behavior: wrap in blockquote OR unwrap from blockquote.
 * Unlike Milkdown's wrapInBlockquoteCommand which only wraps.
 */

import { $command } from "@milkdown/kit/utils";
import { lift, wrapIn } from "@milkdown/kit/prose/commands";
import type { Command } from "@milkdown/kit/prose/state";

/**
 * Check if cursor is inside a blockquote node.
 */
function isInBlockquote(state: Parameters<Command>[0]): boolean {
  const { $from } = state.selection;
  const blockquoteType = state.schema.nodes.blockquote;
  if (!blockquoteType) return false;

  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type === blockquoteType) {
      return true;
    }
  }
  return false;
}

/**
 * Toggle blockquote command.
 * If inside blockquote → lift out (unwrap)
 * If not in blockquote → wrap in blockquote
 */
export const toggleBlockquoteCommand = $command(
  "ToggleBlockquote",
  () => (): Command =>
    (state, dispatch) => {
      const blockquoteType = state.schema.nodes.blockquote;
      if (!blockquoteType) return false;

      if (isInBlockquote(state)) {
        // Inside blockquote → lift out
        return lift(state, dispatch);
      } else {
        // Not in blockquote → wrap
        return wrapIn(blockquoteType)(state, dispatch);
      }
    }
);

export default toggleBlockquoteCommand;
