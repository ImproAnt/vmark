/**
 * Smart Paste Plugin
 *
 * When text is selected and user pastes a URL,
 * creates a markdown link: [selected text](pasted URL)
 */

import { $prose } from "@milkdown/kit/utils";
import { Plugin, PluginKey } from "@milkdown/kit/prose/state";
import type { EditorView } from "@milkdown/kit/prose/view";

export const smartPastePluginKey = new PluginKey("smartPaste");

/**
 * Check if string is a valid HTTP/HTTPS URL.
 */
function isValidUrl(str: string): boolean {
  return /^https?:\/\//i.test(str.trim());
}

/**
 * Handle paste event - convert URL paste on selection to link.
 */
function handlePaste(view: EditorView, event: ClipboardEvent): boolean {
  const { from, to, empty } = view.state.selection;

  // Only handle when there's a selection
  if (empty) return false;

  const url = event.clipboardData?.getData("text/plain")?.trim();
  if (!url || !isValidUrl(url)) return false;

  // Check if selection is already a link
  const linkMark = view.state.schema.marks.link;
  if (!linkMark) return false;
  if (view.state.doc.rangeHasMark(from, to, linkMark)) return false;

  // Prevent default paste and create link
  event.preventDefault();

  const tr = view.state.tr.addMark(from, to, linkMark.create({ href: url }));
  view.dispatch(tr);

  return true;
}

/**
 * Milkdown plugin for smart URL paste.
 */
export const smartPastePlugin = $prose(() => {
  return new Plugin({
    key: smartPastePluginKey,
    props: {
      handlePaste,
    },
  });
});

export default smartPastePlugin;
