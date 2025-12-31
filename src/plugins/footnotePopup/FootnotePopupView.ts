/**
 * Footnote Popup View
 *
 * Manages the DOM for the footnote hover popup with inline editing.
 * Similar to LinkPopupView - allows editing footnote content directly.
 */

import type { EditorView } from "@milkdown/kit/prose/view";
import { useFootnotePopupStore } from "@/stores/footnotePopupStore";
import {
  calculatePopupPosition,
  getBoundaryRects,
  getViewportBounds,
  type AnchorRect,
} from "@/utils/popupPosition";
import { scrollToPosition } from "./utils";

// SVG Icons
const icons = {
  save: `<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
  goto: `<svg viewBox="0 0 24 24"><path d="M12 5v14"/><polyline points="19 12 12 19 5 12"/></svg>`,
};

export class FootnotePopupView {
  private container: HTMLDivElement;
  private textarea: HTMLTextAreaElement;
  private view: EditorView;
  private unsubscribe: () => void;
  private justOpened = false;
  private wasOpen = false;

  constructor(view: EditorView) {
    this.view = view;

    // Build DOM structure
    this.container = this.buildContainer();
    this.textarea = this.container.querySelector(
      ".footnote-popup-textarea"
    ) as HTMLTextAreaElement;

    // Add to DOM
    document.body.appendChild(this.container);

    // Handle mouse leave from popup (only when not editing)
    this.container.addEventListener("mouseleave", this.handlePopupMouseLeave);

    // Handle click outside
    document.addEventListener("mousedown", this.handleClickOutside);

    // Subscribe to store - only show() on open transition
    this.unsubscribe = useFootnotePopupStore.subscribe((state) => {
      if (state.isOpen && state.anchorRect) {
        if (!this.wasOpen) {
          this.show(state.content, state.anchorRect, state.definitionPos);
        }
        this.wasOpen = true;
      } else {
        this.hide();
        this.wasOpen = false;
      }
    });

    // Initial state
    const state = useFootnotePopupStore.getState();
    if (state.isOpen && state.anchorRect) {
      this.show(state.content, state.anchorRect, state.definitionPos);
    }
  }

  private buildContainer(): HTMLDivElement {
    const container = document.createElement("div");
    container.className = "footnote-popup";
    container.style.display = "none";

    // Textarea for editing
    const textarea = document.createElement("textarea");
    textarea.className = "footnote-popup-textarea";
    textarea.placeholder = "Footnote content...";
    textarea.rows = 2;
    textarea.addEventListener("input", this.handleInputChange);
    textarea.addEventListener("keydown", this.handleInputKeydown);
    textarea.addEventListener("click", this.handleTextareaClick);
    textarea.addEventListener("blur", this.handleTextareaBlur);
    container.appendChild(textarea);

    // Button row with label on left, buttons on right
    const btnRow = document.createElement("div");
    btnRow.className = "footnote-popup-buttons";

    // Label display (bottom-left)
    const labelEl = document.createElement("div");
    labelEl.className = "footnote-popup-label";
    btnRow.appendChild(labelEl);

    // Spacer
    const spacer = document.createElement("div");
    spacer.style.flex = "1";
    btnRow.appendChild(spacer);

    const gotoBtn = this.buildIconButton(icons.goto, "Go to definition", this.handleGoto);
    gotoBtn.classList.add("footnote-popup-btn-goto");

    const saveBtn = this.buildIconButton(icons.save, "Save (Enter)", this.handleSave);
    saveBtn.classList.add("footnote-popup-btn-save");

    btnRow.appendChild(gotoBtn);
    btnRow.appendChild(saveBtn);
    container.appendChild(btnRow);

    return container;
  }

  private buildIconButton(
    iconSvg: string,
    title: string,
    onClick: () => void
  ): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.className = "footnote-popup-btn";
    btn.type = "button";
    btn.title = title;
    btn.innerHTML = iconSvg;
    btn.addEventListener("click", onClick);
    return btn;
  }

  private show(content: string, anchorRect: DOMRect, definitionPos: number | null) {
    const state = useFootnotePopupStore.getState();

    // Update label
    const labelEl = this.container.querySelector(".footnote-popup-label");
    if (labelEl) {
      labelEl.textContent = `[${state.label}]`;
    }

    // Update textarea
    this.textarea.value = content;
    this.container.style.display = "flex";

    // Show/hide goto button based on whether definition exists
    const gotoBtn = this.container.querySelector(".footnote-popup-btn-goto") as HTMLElement;
    if (gotoBtn) {
      gotoBtn.style.display = definitionPos !== null ? "flex" : "none";
    }

    // Set guard to prevent immediate close
    this.justOpened = true;
    requestAnimationFrame(() => {
      this.justOpened = false;
    });

    // Position popup
    this.updatePosition(anchorRect);

    // Auto-resize textarea
    this.autoResizeTextarea();
  }

  private hide() {
    this.container.style.display = "none";
  }

  private updatePosition(anchorRect: DOMRect) {
    const containerEl = this.view.dom.closest(".editor-container") as HTMLElement;
    const bounds = containerEl
      ? getBoundaryRects(this.view.dom as HTMLElement, containerEl)
      : getViewportBounds();

    const anchor: AnchorRect = {
      top: anchorRect.top,
      left: anchorRect.left,
      bottom: anchorRect.bottom,
      right: anchorRect.right,
    };

    // Measure popup after content is set
    const popupRect = this.container.getBoundingClientRect();

    const position = calculatePopupPosition({
      anchor,
      popup: { width: popupRect.width || 280, height: popupRect.height || 80 },
      bounds,
      gap: 8,
      preferAbove: true,
    });

    this.container.style.left = `${position.left}px`;
    this.container.style.top = `${position.top}px`;
  }

  private autoResizeTextarea() {
    this.textarea.style.height = "auto";
    this.textarea.style.height = Math.min(this.textarea.scrollHeight, 120) + "px";
  }

  private handleInputChange = () => {
    useFootnotePopupStore.getState().setContent(this.textarea.value);
    this.autoResizeTextarea();
  };

  private handleInputKeydown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      useFootnotePopupStore.getState().closePopup();
      this.view.focus();
    }
  };

  private handleTextareaClick = () => {
    this.container.classList.add("editing");
    this.textarea.focus();
  };

  private handleTextareaBlur = () => {
    // Delay to allow button clicks to register
    setTimeout(() => {
      if (!this.container.contains(document.activeElement)) {
        this.container.classList.remove("editing");
      }
    }, 100);
  };

  private handleSave = () => {
    const state = useFootnotePopupStore.getState();
    const { content, definitionPos } = state;

    if (definitionPos === null) {
      state.closePopup();
      this.view.focus();
      return;
    }

    try {
      const { state: editorState, dispatch } = this.view;
      const node = editorState.doc.nodeAt(definitionPos);

      if (node && node.type.name === "footnote_definition") {
        // Create a text node with the new content
        const schema = editorState.schema;
        const textNode = schema.text(content);
        const paragraph = schema.nodes.paragraph.create(null, textNode);

        // Replace the content of the footnote definition
        // The structure is: footnote_definition > paragraph > text
        const contentStart = definitionPos + 1;
        const contentEnd = definitionPos + node.nodeSize - 1;

        const tr = editorState.tr.replaceWith(contentStart, contentEnd, paragraph);
        dispatch(tr);
      }

      state.closePopup();
      this.view.focus();
    } catch (error) {
      console.error("[FootnotePopup] Save failed:", error);
      state.closePopup();
      this.view.focus();
    }
  };

  private handleGoto = () => {
    const { definitionPos } = useFootnotePopupStore.getState();
    if (definitionPos !== null) {
      this.scrollToDefinition(definitionPos);
    }
  };

  private scrollToDefinition(pos: number) {
    scrollToPosition(this.view, pos);
    useFootnotePopupStore.getState().closePopup();
    this.view.focus();
  }

  private handlePopupMouseLeave = () => {
    // Don't close if user is editing (textarea focused)
    if (this.container.classList.contains("editing")) {
      return;
    }
    useFootnotePopupStore.getState().closePopup();
  };

  private handleClickOutside = (e: MouseEvent) => {
    if (this.justOpened) return;

    const { isOpen } = useFootnotePopupStore.getState();
    if (!isOpen) return;

    const target = e.target as Node;
    if (!this.container.contains(target)) {
      useFootnotePopupStore.getState().closePopup();
    }
  };

  update() {
    const state = useFootnotePopupStore.getState();
    if (state.isOpen && state.anchorRect) {
      this.updatePosition(state.anchorRect);
    }
  }

  destroy() {
    this.unsubscribe();
    this.container.removeEventListener("mouseleave", this.handlePopupMouseLeave);
    document.removeEventListener("mousedown", this.handleClickOutside);
    this.container.remove();
  }
}
