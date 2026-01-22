import type { EditorView } from "@tiptap/pm/view";
import { alignColumn, type TableAlignment, addColLeft, addColRight, addRowAbove, addRowBelow, deleteCurrentColumn, deleteCurrentRow, deleteCurrentTable, formatTable } from "./tableActions.tiptap";
import { icons } from "@/utils/icons";

interface MenuAction {
  label: string;
  icon: string;
  action: () => void;
  dividerAfter?: boolean;
  danger?: boolean;
}

export class TiptapTableContextMenu {
  private container: HTMLElement;
  private editorView: EditorView;
  private isVisible = false;

  constructor(view: EditorView) {
    this.editorView = view;
    this.container = this.buildContainer();
    document.body.appendChild(this.container);
    document.addEventListener("mousedown", this.handleClickOutside);
  }

  updateView(view: EditorView) {
    this.editorView = view;
  }

  private buildContainer(): HTMLElement {
    const container = document.createElement("div");
    container.className = "table-context-menu";
    container.style.display = "none";
    return container;
  }

  private buildMenu(): void {
    this.container.innerHTML = "";

    const alignCol = (alignment: TableAlignment) => () => alignColumn(this.editorView, alignment, false);
    const alignAll = (alignment: TableAlignment) => () => alignColumn(this.editorView, alignment, true);

    const actions: MenuAction[] = [
      { label: "Insert Row Above", icon: icons.rowAbove, action: () => addRowAbove(this.editorView) },
      { label: "Insert Row Below", icon: icons.rowBelow, action: () => addRowBelow(this.editorView) },
      { label: "Insert Column Left", icon: icons.colLeft, action: () => addColLeft(this.editorView) },
      { label: "Insert Column Right", icon: icons.colRight, action: () => addColRight(this.editorView), dividerAfter: true },
      { label: "Delete Row", icon: icons.deleteRow, action: () => deleteCurrentRow(this.editorView), danger: true },
      { label: "Delete Column", icon: icons.deleteCol, action: () => deleteCurrentColumn(this.editorView), danger: true },
      { label: "Delete Table", icon: icons.deleteTable, action: () => deleteCurrentTable(this.editorView), danger: true, dividerAfter: true },
      { label: "Align Column Left", icon: icons.alignLeft, action: alignCol("left") },
      { label: "Align Column Center", icon: icons.alignCenter, action: alignCol("center") },
      { label: "Align Column Right", icon: icons.alignRight, action: alignCol("right"), dividerAfter: true },
      { label: "Align All Left", icon: icons.alignAllLeft, action: alignAll("left") },
      { label: "Align All Center", icon: icons.alignAllCenter, action: alignAll("center") },
      { label: "Align All Right", icon: icons.alignAllRight, action: alignAll("right"), dividerAfter: true },
      { label: "Format Table", icon: icons.formatTable, action: () => formatTable(this.editorView) },
    ];

    for (const item of actions) {
      const menuItem = document.createElement("button");
      menuItem.className = `table-context-menu-item${item.danger ? " table-context-menu-item-danger" : ""}`;
      menuItem.type = "button";

      const iconSpan = document.createElement("span");
      iconSpan.className = "table-context-menu-icon";
      iconSpan.innerHTML = item.icon;
      menuItem.appendChild(iconSpan);

      const labelSpan = document.createElement("span");
      labelSpan.className = "table-context-menu-label";
      labelSpan.textContent = item.label;
      menuItem.appendChild(labelSpan);

      menuItem.addEventListener("mousedown", (e) => e.preventDefault());
      menuItem.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        item.action();
        this.hide();
      });

      this.container.appendChild(menuItem);

      if (item.dividerAfter) {
        const divider = document.createElement("div");
        divider.className = "table-context-menu-divider";
        this.container.appendChild(divider);
      }
    }
  }

  show(x: number, y: number) {
    this.buildMenu();

    this.container.style.display = "flex";
    this.container.style.position = "fixed";
    this.container.style.left = `${x}px`;
    this.container.style.top = `${y}px`;

    requestAnimationFrame(() => {
      const rect = this.container.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Find editor container for bottom boundary
      const editorContainer = this.editorView.dom.closest(".editor-container");
      const editorRect = editorContainer?.getBoundingClientRect();
      // Use editor bottom with 1em margin, or fallback to viewport
      const bottomMargin = 16; // ~1em
      const maxBottom = editorRect
        ? editorRect.bottom - bottomMargin
        : viewportHeight - 10;

      if (rect.right > viewportWidth - 10) {
        this.container.style.left = `${viewportWidth - rect.width - 10}px`;
      }

      if (rect.bottom > maxBottom) {
        this.container.style.top = `${maxBottom - rect.height}px`;
      }
    });

    this.isVisible = true;
  }

  hide() {
    this.container.style.display = "none";
    this.isVisible = false;
  }

  private handleClickOutside = (e: MouseEvent) => {
    if (!this.isVisible) return;
    const target = e.target as Node;
    if (!this.container.contains(target)) {
      this.hide();
    }
  };

  destroy() {
    document.removeEventListener("mousedown", this.handleClickOutside);
    this.container.remove();
  }
}

