import { forwardRef, useEffect, useMemo, useRef } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { ToolbarMenuItem } from "./toolbarGroups";
import type { ToolbarItemState } from "@/plugins/toolbarActions/enableRules";

interface GroupDropdownItem {
  item: ToolbarMenuItem;
  state: ToolbarItemState;
}

interface GroupDropdownProps {
  anchorRect: DOMRect;
  items: GroupDropdownItem[];
  onSelect: (action: string) => void;
  onClose: () => void;
}

const GroupDropdown = forwardRef<HTMLDivElement, GroupDropdownProps>(
  ({ anchorRect, items, onSelect, onClose }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const enabledIndices = useMemo(
      () => items.map((entry, index) => (entry.state.disabled ? -1 : index)).filter((i) => i >= 0),
      [items]
    );

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const buttons = container.querySelectorAll<HTMLButtonElement>(
        ".universal-toolbar-dropdown-item"
      );
      const firstEnabled = enabledIndices[0] ?? 0;
      const targetButton = buttons[firstEnabled] ?? buttons[0];
      targetButton?.focus();
    }, [enabledIndices]);

    const handleKeyDown = (event: ReactKeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "Tab") {
        event.preventDefault();
        const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>(
          ".universal-toolbar-dropdown-item"
        );
        if (!buttons || buttons.length === 0) return;
        const activeIndex = Array.from(buttons).indexOf(document.activeElement as HTMLButtonElement);
        const direction = event.shiftKey ? -1 : 1;
        const nextIndex = (activeIndex + direction + buttons.length) % buttons.length;
        buttons[nextIndex]?.focus();
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>(
          ".universal-toolbar-dropdown-item"
        );
        if (!buttons || buttons.length === 0) return;
        const activeIndex = Array.from(buttons).indexOf(document.activeElement as HTMLButtonElement);
        const direction = event.key === "ArrowDown" ? 1 : -1;
        const nextIndex = (activeIndex + direction + buttons.length) % buttons.length;
        buttons[nextIndex]?.focus();
      }
    };

    return (
      <div
        ref={(node) => {
          containerRef.current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className="universal-toolbar-dropdown"
        style={{ top: anchorRect.top - 8, left: anchorRect.left }}
        onKeyDown={handleKeyDown}
        role="menu"
        aria-label="Toolbar group"
      >
        {items.map(({ item, state }) => (
          <button
            key={item.id}
            type="button"
            className={`universal-toolbar-dropdown-item${state.active ? " active" : ""}`}
            onClick={() => onSelect(item.action)}
            disabled={state.disabled}
            title={state.notImplemented ? `${item.label} — Not available yet` : item.label}
          >
            <span
              className="universal-toolbar-dropdown-icon"
              dangerouslySetInnerHTML={{ __html: item.icon }}
            />
            <span className="universal-toolbar-dropdown-label">{item.label}</span>
            {item.shortcut && (
              <span className="universal-toolbar-dropdown-shortcut">{item.shortcut}</span>
            )}
          </button>
        ))}
      </div>
    );
  }
);

GroupDropdown.displayName = "GroupDropdown";

export { GroupDropdown };
