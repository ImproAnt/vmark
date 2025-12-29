/**
 * Focus Mode Plugin
 *
 * Highlights the current block by adding .md-focus class via ProseMirror decorations.
 * Uses the proper decoration API instead of direct DOM manipulation.
 *
 * References:
 * - https://prosemirror.net/docs/ref/#view.Decoration
 * - https://support.example.com/Focus-and-Typewriter-Mode/
 */

import { $prose } from "@milkdown/kit/utils";
import { Plugin, PluginKey, type EditorState } from "@milkdown/kit/prose/state";
import { Decoration, DecorationSet } from "@milkdown/kit/prose/view";
import type { EditorView } from "@milkdown/kit/prose/view";
import { useEditorStore } from "@/stores/editorStore";

const focusPluginKey = new PluginKey("focusMode");

/**
 * Creates a decoration set for the current block if focus mode is enabled
 */
function createFocusDecoration(state: EditorState): DecorationSet | null {
  const focusEnabled = useEditorStore.getState().focusModeEnabled;
  if (!focusEnabled) return null;

  const { selection } = state;
  const { $from } = selection;

  // depth 0 = doc, depth 1 = top-level block
  if ($from.depth < 1) return null;

  try {
    const start = $from.before(1);
    const end = $from.after(1);

    const decoration = Decoration.node(start, end, {
      class: "md-focus",
    });

    return DecorationSet.create(state.doc, [decoration]);
  } catch {
    return null;
  }
}

export const focusModePlugin = $prose(() => {
  // Track previous focus mode state to detect changes
  let lastFocusMode = useEditorStore.getState().focusModeEnabled;

  return new Plugin({
    key: focusPluginKey,
    view: (view: EditorView) => {
      // Subscribe to store changes to force decoration update
      const unsubscribe = useEditorStore.subscribe((state) => {
        if (state.focusModeEnabled !== lastFocusMode) {
          lastFocusMode = state.focusModeEnabled;
          // Force ProseMirror to recalculate decorations by dispatching empty transaction
          view.dispatch(view.state.tr);
        }
      });

      return {
        destroy: () => {
          unsubscribe();
        },
      };
    },
    props: {
      decorations(state) {
        return createFocusDecoration(state);
      },
    },
  });
});
