/**
 * Footnote Popup Plugin
 *
 * Shows a tooltip popup when hovering over footnote references.
 * Clicking the popup scrolls to the footnote definition.
 */

import { $prose } from "@milkdown/kit/utils";
import { Plugin, PluginKey, PluginView } from "@milkdown/kit/prose/state";
import type { EditorView } from "@milkdown/kit/prose/view";
import type { Node as ProsemirrorNode } from "@milkdown/kit/prose/model";
import { FootnotePopupView } from "./FootnotePopupView";
import { useFootnotePopupStore } from "@/stores/footnotePopupStore";
import { scrollToPosition } from "./utils";

export const footnotePopupPluginKey = new PluginKey("footnotePopup");

/**
 * Find footnote definition content by label.
 */
function findFootnoteDefinition(
  view: EditorView,
  label: string
): { content: string; pos: number } | null {
  const { doc } = view.state;
  let result: { content: string; pos: number } | null = null;

  doc.descendants((node: ProsemirrorNode, pos: number) => {
    if (result) return false; // Stop if found

    if (node.type.name === "footnote_definition" && node.attrs.label === label) {
      // Extract text content from definition
      let content = "";
      node.content.forEach((child: ProsemirrorNode) => {
        if (child.isText) {
          content += child.text;
        } else if (child.isTextblock) {
          child.content.forEach((textNode: ProsemirrorNode) => {
            if (textNode.isText) {
              content += textNode.text;
            }
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
function findFootnoteReference(
  view: EditorView,
  label: string
): number | null {
  const { doc } = view.state;
  let result: number | null = null;

  doc.descendants((node: ProsemirrorNode, pos: number) => {
    if (result !== null) return false; // Stop if found

    if (node.type.name === "footnote_reference" && node.attrs.label === label) {
      result = pos;
      return false;
    }
    return true;
  });

  return result;
}

/**
 * Check if element is a footnote reference.
 */
function isFootnoteReference(element: HTMLElement): boolean {
  return (
    element.tagName === "SUP" &&
    element.getAttribute("data-type") === "footnote_reference"
  );
}

/**
 * Check if element is a footnote definition.
 */
function isFootnoteDefinition(element: HTMLElement): boolean {
  return (
    element.tagName === "DL" &&
    element.getAttribute("data-type") === "footnote_definition"
  );
}

/**
 * Get footnote reference element from event target.
 */
function getFootnoteRefFromTarget(target: EventTarget | null): HTMLElement | null {
  let el = target as HTMLElement | null;

  // Walk up to find footnote reference (might be on ::before/::after pseudo)
  while (el && el !== document.body) {
    if (isFootnoteReference(el)) {
      return el;
    }
    el = el.parentElement;
  }

  return null;
}

/**
 * Get footnote definition element from event target.
 */
function getFootnoteDefFromTarget(target: EventTarget | null): HTMLElement | null {
  let el = target as HTMLElement | null;

  while (el && el !== document.body) {
    if (isFootnoteDefinition(el)) {
      return el;
    }
    el = el.parentElement;
  }

  return null;
}

let hoverTimeout: ReturnType<typeof setTimeout> | null = null;
let currentRefElement: HTMLElement | null = null;

/**
 * Handle mouse enter on footnote reference.
 */
function handleMouseOver(view: EditorView, event: MouseEvent): boolean {
  const refElement = getFootnoteRefFromTarget(event.target);

  if (!refElement) {
    return false;
  }

  // Avoid re-triggering on same element
  if (currentRefElement === refElement) {
    return false;
  }

  currentRefElement = refElement;

  // Clear any pending timeout
  if (hoverTimeout) {
    clearTimeout(hoverTimeout);
  }

  // Delay to avoid flickering on quick mouse moves
  hoverTimeout = setTimeout(() => {
    const label = refElement.getAttribute("data-label");
    if (!label) return;

    const definition = findFootnoteDefinition(view, label);
    const content = definition?.content ?? "Footnote not found";
    const defPos = definition?.pos ?? null;

    const rect = refElement.getBoundingClientRect();
    useFootnotePopupStore.getState().openPopup(label, content, rect, defPos);
  }, 150);

  return false;
}

/**
 * Handle mouse leave from footnote reference.
 */
function handleMouseOut(_view: EditorView, event: MouseEvent): boolean {
  const relatedTarget = event.relatedTarget as HTMLElement | null;

  // Check if moving to the popup itself
  if (relatedTarget?.closest(".footnote-popup")) {
    return false;
  }

  // Check if still on a footnote reference
  if (relatedTarget && getFootnoteRefFromTarget(relatedTarget)) {
    return false;
  }

  // Clear hover state
  if (hoverTimeout) {
    clearTimeout(hoverTimeout);
    hoverTimeout = null;
  }
  currentRefElement = null;

  // Delay closing to allow moving to popup
  setTimeout(() => {
    const popup = document.querySelector(".footnote-popup");
    if (!popup?.matches(":hover")) {
      useFootnotePopupStore.getState().closePopup();
    }
  }, 100);

  return false;
}

/**
 * Handle click on footnote reference or definition.
 * - Click on reference: scroll to definition
 * - Click on definition: scroll back to reference
 */
function handleClick(view: EditorView, _pos: number, event: MouseEvent): boolean {
  // Check for footnote reference click -> go to definition
  const refElement = getFootnoteRefFromTarget(event.target);
  if (refElement) {
    const label = refElement.getAttribute("data-label");
    if (label) {
      const definition = findFootnoteDefinition(view, label);
      if (definition) {
        scrollToPosition(view, definition.pos);
        // Close popup if open
        useFootnotePopupStore.getState().closePopup();
        return true; // Prevent default
      }
    }
  }

  // Check for footnote definition click -> go back to reference
  const defElement = getFootnoteDefFromTarget(event.target);
  if (defElement) {
    const label = defElement.getAttribute("data-label");
    if (label) {
      const refPos = findFootnoteReference(view, label);
      if (refPos !== null) {
        scrollToPosition(view, refPos);
        return true; // Prevent default
      }
    }
  }

  return false;
}

/**
 * Plugin view that manages the FootnotePopupView lifecycle.
 */
class FootnotePopupPluginView implements PluginView {
  private popupView: FootnotePopupView;

  constructor(view: EditorView) {
    this.popupView = new FootnotePopupView(view);
  }

  update() {
    this.popupView.update();
  }

  destroy() {
    this.popupView.destroy();
  }
}

/**
 * Create the footnote popup plugin.
 */
export const footnotePopupPlugin = $prose(() => {
  return new Plugin({
    key: footnotePopupPluginKey,
    view(editorView: EditorView) {
      return new FootnotePopupPluginView(editorView);
    },
    props: {
      handleClick,
      handleDOMEvents: {
        mouseover: handleMouseOver,
        mouseout: handleMouseOut,
      },
    },
  });
});
