/**
 * Syntax Reveal Plugin
 *
 * Shows markdown syntax markers when cursor is inside formatted content.
 * Uses ProseMirror decorations to display syntax without modifying document.
 *
 * Supports:
 * - Marks: bold (**), italic (*), code (`), strikethrough (~~), link ([])
 */

import { $prose } from "@milkdown/kit/utils";
import { Plugin, PluginKey } from "@milkdown/kit/prose/state";
import { Decoration, DecorationSet } from "@milkdown/kit/prose/view";
import { useSettingsStore } from "@/stores/settingsStore";
import { addMarkSyntaxDecorations } from "./marks";

// Plugin key for external access
export const syntaxRevealPluginKey = new PluginKey("syntaxReveal");

/**
 * Create the syntax reveal plugin
 */
export const syntaxRevealPlugin = $prose(() => {
  return new Plugin({
    key: syntaxRevealPluginKey,

    props: {
      decorations(state) {
        // Check if syntax reveal is enabled in settings
        const { revealInlineSyntax } = useSettingsStore.getState().markdown;
        if (!revealInlineSyntax) {
          return DecorationSet.empty;
        }

        const { selection } = state;
        const { $from, empty } = selection;

        // Only show syntax for cursor (not selection)
        if (!empty) {
          return DecorationSet.empty;
        }

        const decorations: Decoration[] = [];
        const pos = $from.pos;

        // Add mark-based syntax decorations (bold, italic, etc.)
        addMarkSyntaxDecorations(decorations, pos, $from);

        if (decorations.length === 0) {
          return DecorationSet.empty;
        }

        return DecorationSet.create(state.doc, decorations);
      },
    },
  });
});

export default syntaxRevealPlugin;
