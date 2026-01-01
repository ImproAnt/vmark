/**
 * Footnote Popup Utilities
 *
 * Shared utility functions for the footnote popup plugin.
 */

import type { EditorView } from "@milkdown/kit/prose/view";
import type { Node as ProsemirrorNode } from "@milkdown/kit/prose/model";

/** Scroll offset to position target below viewport top */
const SCROLL_OFFSET_PX = 100;

/**
 * Scroll the editor to bring a position into view.
 */
export function scrollToPosition(view: EditorView, pos: number) {
  const coords = view.coordsAtPos(pos);
  if (coords) {
    const editorContent = document.querySelector(".editor-content");
    if (editorContent) {
      const editorRect = editorContent.getBoundingClientRect();
      const scrollTop = coords.top - editorRect.top + editorContent.scrollTop - SCROLL_OFFSET_PX;
      editorContent.scrollTo({ top: scrollTop, behavior: "smooth" });
    }
  }
}

/**
 * Find footnote definition content by label.
 */
export function findFootnoteDefinition(
  view: EditorView,
  label: string
): { content: string; pos: number } | null {
  const { doc } = view.state;
  let result: { content: string; pos: number } | null = null;

  doc.descendants((node: ProsemirrorNode, pos: number) => {
    if (result) return false;
    if (node.type.name === "footnote_definition" && node.attrs.label === label) {
      let content = "";
      node.content.forEach((child: ProsemirrorNode) => {
        if (child.isText) {
          content += child.text;
        } else if (child.isTextblock) {
          child.content.forEach((textNode: ProsemirrorNode) => {
            if (textNode.isText) content += textNode.text;
          });
        }
      });
      result = { content: content.trim() || "Empty footnote", pos };
      return false;
    }
    return true;
  });
  return result;
}

/**
 * Find footnote reference position by label.
 */
export function findFootnoteReference(view: EditorView, label: string): number | null {
  const { doc } = view.state;
  let result: number | null = null;

  doc.descendants((node: ProsemirrorNode, pos: number) => {
    if (result !== null) return false;
    if (node.type.name === "footnote_reference" && node.attrs.label === label) {
      result = pos;
      return false;
    }
    return true;
  });
  return result;
}

/** CSS selector for footnote reference */
const FOOTNOTE_REF_SELECTOR = 'sup[data-type="footnote_reference"]';

/** CSS selector for footnote definition */
const FOOTNOTE_DEF_SELECTOR = 'dl[data-type="footnote_definition"]';

/**
 * Get the closest ancestor matching a selector from an event target.
 * Safely handles non-Element targets (Text nodes, etc).
 */
function getClosestElement(target: EventTarget | null, selector: string): HTMLElement | null {
  if (!target) return null;

  // Handle non-Element nodes (Text, Comment, etc)
  let el: Element | null = null;
  if (target instanceof Element) {
    el = target;
  } else if (target instanceof Node && target.parentElement) {
    el = target.parentElement;
  }

  if (!el) return null;

  // Use closest() which handles the element itself and ancestors
  return el.closest<HTMLElement>(selector);
}

/** Get footnote reference element from event target. */
export function getFootnoteRefFromTarget(target: EventTarget | null): HTMLElement | null {
  return getClosestElement(target, FOOTNOTE_REF_SELECTOR);
}

/** Get footnote definition element from event target. */
export function getFootnoteDefFromTarget(target: EventTarget | null): HTMLElement | null {
  return getClosestElement(target, FOOTNOTE_DEF_SELECTOR);
}
