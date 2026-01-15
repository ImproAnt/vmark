/**
 * Format Toolbar Extension for Tiptap
 *
 * NOTE: Ctrl+E is now handled by the universal toolbar (useUniversalToolbar hook).
 * The context-aware popup toolbars have been retired in favor of the universal toolbar.
 *
 * This extension provides:
 * - Selection persist decoration (highlights selection when toolbar is open)
 */
import { Extension } from "@tiptap/core";
import { NodeSelection, Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { useFormatToolbarStore } from "@/stores/formatToolbarStore";

const formatToolbarPluginKey = new PluginKey("tiptapFormatToolbar");

export const formatToolbarExtension = Extension.create({
  name: "formatToolbar",
  priority: 1100,
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: formatToolbarPluginKey,
        props: {
          decorations(state) {
            const store = useFormatToolbarStore.getState();
            const selection = state.selection;
            if (!store.isOpen || selection.empty) return null;
            if (selection instanceof NodeSelection) return null;
            const decoration = Decoration.inline(selection.from, selection.to, {
              class: "pm-selection-persist",
            });
            return DecorationSet.create(state.doc, [decoration]);
          },
        },
      }),
    ];
  },
});
