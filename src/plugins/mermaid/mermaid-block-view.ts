/**
 * Mermaid Block NodeView
 *
 * -style click-to-edit behavior:
 * - Shows rendered diagram by default
 * - Click to reveal textarea editor
 * - Blur to save and show rendered output
 */

import { $view } from "@milkdown/kit/utils";
import type { EditorView, NodeView } from "@milkdown/kit/prose/view";
import type { Node } from "@milkdown/kit/prose/model";
import { renderMermaid } from "./index";
import { mermaidBlockSchema } from "./mermaid-block-schema";

/**
 * NodeView for mermaid block with click-to-edit.
 */
class MermaidBlockNodeView implements NodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement | undefined = undefined;

  private preview: HTMLElement;
  private editor: HTMLTextAreaElement;
  private isEditing = false;
  private view: EditorView;
  private getPos: () => number | undefined;
  private currentContent: string;
  private renderId = 0; // For tracking async renders

  constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
    this.view = view;
    this.getPos = getPos;
    this.currentContent = node.textContent || "";

    // Create container
    this.dom = document.createElement("div");
    this.dom.className = "mermaid-block";
    this.dom.dataset.type = "mermaid_block";

    // Create preview element
    this.preview = document.createElement("div");
    this.preview.className = "mermaid-block-preview";
    this.preview.addEventListener("click", this.handlePreviewClick);
    this.dom.appendChild(this.preview);

    // Create editor textarea
    this.editor = document.createElement("textarea");
    this.editor.className = "mermaid-block-editor";
    this.editor.placeholder = "Enter Mermaid diagram code...";
    this.editor.addEventListener("blur", this.handleBlur);
    this.editor.addEventListener("keydown", this.handleKeyDown);
    this.editor.addEventListener("input", this.handleInput);
    this.dom.appendChild(this.editor);

    // Initial render
    this.renderPreview();
  }

  private async renderPreview(): Promise<void> {
    const content = this.currentContent.trim();
    const renderId = ++this.renderId;

    if (!content) {
      this.preview.innerHTML = '<span class="mermaid-block-placeholder">Click to add Mermaid diagram...</span>';
      return;
    }

    // Show loading state
    this.preview.innerHTML = '<span class="mermaid-block-loading">Rendering diagram...</span>';

    try {
      const svg = await renderMermaid(content);

      // Check if this render is still current
      if (renderId !== this.renderId) return;

      if (svg) {
        this.preview.innerHTML = svg;
      } else {
        this.preview.innerHTML = `<pre class="mermaid-error">Failed to render diagram</pre>`;
      }
    } catch (error) {
      if (renderId !== this.renderId) return;
      const message = error instanceof Error ? error.message : "Unknown error";
      this.preview.innerHTML = `<pre class="mermaid-error">${this.escapeHtml(message)}</pre>`;
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  private handlePreviewClick = (): void => {
    this.showEditor();
  };

  private handleBlur = (): void => {
    this.commitAndClose();
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === "Escape") {
      e.preventDefault();
      this.commitAndClose();
    }
    // Allow Tab to insert spaces
    if (e.key === "Tab") {
      e.preventDefault();
      const start = this.editor.selectionStart;
      const end = this.editor.selectionEnd;
      this.editor.value = this.editor.value.substring(0, start) + "    " + this.editor.value.substring(end);
      this.editor.selectionStart = this.editor.selectionEnd = start + 4;
    }
  };

  private handleInput = (): void => {
    // Auto-resize textarea
    this.editor.style.height = "auto";
    this.editor.style.height = this.editor.scrollHeight + "px";
  };

  private showEditor(): void {
    if (this.isEditing) return;
    this.isEditing = true;
    this.dom.classList.add("editing");
    this.editor.value = this.currentContent;
    this.editor.style.height = "auto";
    this.editor.style.height = Math.max(100, this.editor.scrollHeight) + "px";
    this.editor.focus();
    this.editor.select();
  }

  private commitAndClose(): void {
    if (!this.isEditing) return;
    this.isEditing = false;
    this.dom.classList.remove("editing");

    const newContent = this.editor.value;
    if (newContent !== this.currentContent) {
      this.currentContent = newContent;
      this.updateNode(newContent);
      this.renderPreview();
    }

    // Return focus to editor
    this.view.focus();
  }

  private updateNode(content: string): void {
    const pos = this.getPos();
    if (pos === undefined) return;

    const { state } = this.view;
    const node = state.doc.nodeAt(pos);
    if (!node) return;

    // Create transaction to replace node content
    const tr = state.tr;
    const start = pos + 1; // Inside the node
    const end = pos + node.nodeSize - 1;

    if (content) {
      tr.replaceWith(start, end, state.schema.text(content));
    } else {
      tr.delete(start, end);
    }

    this.view.dispatch(tr);
  }

  update(node: Node): boolean {
    if (node.type.name !== "mermaid_block") {
      return false;
    }

    // Only update if not editing and content changed externally
    if (!this.isEditing) {
      const newContent = node.textContent || "";
      if (newContent !== this.currentContent) {
        this.currentContent = newContent;
        this.renderPreview();
      }
    }

    return true;
  }

  selectNode(): void {
    this.dom.classList.add("ProseMirror-selectednode");
  }

  deselectNode(): void {
    this.dom.classList.remove("ProseMirror-selectednode");
  }

  stopEvent(event: Event): boolean {
    // Let the editor handle all events when editing
    if (this.isEditing) {
      return true;
    }
    // Stop click events on preview
    if (event.type === "mousedown" || event.type === "click") {
      return true;
    }
    return false;
  }

  ignoreMutation(): boolean {
    return true;
  }

  destroy(): void {
    this.preview.removeEventListener("click", this.handlePreviewClick);
    this.editor.removeEventListener("blur", this.handleBlur);
    this.editor.removeEventListener("keydown", this.handleKeyDown);
    this.editor.removeEventListener("input", this.handleInput);
  }
}

/**
 * Milkdown plugin for mermaid block view.
 */
export const mermaidBlockView = $view(mermaidBlockSchema.node, () => {
  return (node, view, getPos) => new MermaidBlockNodeView(node, view, getPos);
});
