/**
 * UniversalToolbar - Bottom formatting toolbar
 *
 * A universal, single-line toolbar anchored at the bottom of the window.
 * Triggered by Ctrl+E, provides consistent formatting actions across
 * both WYSIWYG and Source modes.
 *
 * @module components/Editor/UniversalToolbar
 */
import { useCallback, useMemo } from "react";
import { useUIStore } from "@/stores/uiStore";
import { TOOLBAR_GROUPS, getAllButtons } from "./toolbarGroups";
import { ToolbarButton } from "./ToolbarButton";
import { useToolbarKeyboard } from "./useToolbarKeyboard";
import "./universal-toolbar.css";

/**
 * Universal bottom toolbar for formatting actions.
 *
 * Renders a fixed-position toolbar at the bottom of the editor window.
 * Visibility is controlled by the `universalToolbarVisible` state in uiStore.
 *
 * Uses FindBar geometry tokens for consistent bottom-bar alignment:
 * - Height: 40px
 * - Padding: 6px 12px
 * - Row height: 28px
 *
 * @example
 * // In App.tsx or EditorContainer
 * <UniversalToolbar />
 */
export function UniversalToolbar() {
  const visible = useUIStore((state) => state.universalToolbarVisible);

  // Get flat button list for navigation (excludes separators)
  const buttons = useMemo(
    () => getAllButtons().filter((b) => b.type !== "separator"),
    []
  );

  // Action handler
  const handleAction = useCallback((action: string) => {
    // TODO: Wire to WYSIWYG/Source adapters based on active editor mode
    if (import.meta.env.DEV) {
      console.debug("[UniversalToolbar] Action:", action);
    }
  }, []);

  // Keyboard navigation
  const { containerRef, handleKeyDown, focusedIndex } = useToolbarKeyboard({
    buttonCount: buttons.length,
    onActivate: (index) => {
      const button = buttons[index];
      if (button && !button.enabledIn.includes("never")) {
        handleAction(button.action);
      }
    },
  });

  if (!visible) {
    return null;
  }

  // Build flat index for roving tabindex
  let flatIndex = 0;

  return (
    <div
      ref={containerRef}
      role="toolbar"
      aria-label="Formatting toolbar"
      className="universal-toolbar"
      onKeyDown={handleKeyDown}
    >
      {TOOLBAR_GROUPS.map((group, groupIndex) => (
        <div key={group.id} className="universal-toolbar-group">
          {group.buttons.map((button) => {
            // Skip separators for now
            if (button.type === "separator") return null;

            const currentIndex = flatIndex++;

            // Buttons with enabledIn: ["never"] are not yet implemented
            const notImplemented = button.enabledIn.includes("never");
            // Context-based disable logic would go here (TODO)
            const disabled = false;

            return (
              <ToolbarButton
                key={button.id}
                button={button}
                disabled={disabled}
                notImplemented={notImplemented}
                focusIndex={currentIndex}
                currentFocusIndex={focusedIndex}
                onClick={() => handleAction(button.action)}
              />
            );
          })}
          {/* Separator between groups (except last) */}
          {groupIndex < TOOLBAR_GROUPS.length - 1 && (
            <div className="universal-toolbar-separator" />
          )}
        </div>
      ))}
    </div>
  );
}
