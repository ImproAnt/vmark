/**
 * useToolbarKeyboard - Keyboard navigation hook
 *
 * Handles keyboard events for the universal toolbar.
 * Implements roving tabindex pattern with group navigation.
 *
 * @module components/Editor/UniversalToolbar/useToolbarKeyboard
 */
import { useCallback, useRef, useEffect, useState } from "react";
import { useUIStore } from "@/stores/uiStore";
import {
  getNextButtonIndex,
  getPrevButtonIndex,
  getNextGroupFirstIndex,
  getPrevGroupLastIndex,
  getFirstButtonIndex,
  getLastButtonIndex,
} from "./toolbarNavigation";

interface UseToolbarKeyboardOptions {
  /** Total number of buttons in the toolbar */
  buttonCount: number;
  /** Callback when a button should be activated */
  onActivate: (index: number) => void;
}

interface UseToolbarKeyboardReturn {
  /** Current focused button index (roving tabindex) */
  focusedIndex: number;
  /** Set the focused index */
  setFocusedIndex: (index: number) => void;
  /** Ref to attach to the toolbar container */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Handle keydown events */
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

/**
 * Hook for toolbar keyboard navigation.
 *
 * Implements:
 * - Tab/Shift+Tab: Cycle through buttons
 * - Left/Right: Move within group
 * - Ctrl+Left/Right (Option on Mac): Jump between groups
 * - Home/End: Jump to first/last button
 * - Enter/Space: Activate button
 * - Escape: Close toolbar
 *
 * @param options - Configuration options
 * @returns Keyboard handling state and handlers
 */
export function useToolbarKeyboard(
  options: UseToolbarKeyboardOptions
): UseToolbarKeyboardReturn {
  const { buttonCount, onActivate } = options;
  const containerRef = useRef<HTMLDivElement>(null);

  // Get initial focus from store (persisted across opens)
  const lastFocusedIndex = useUIStore((state) => state.lastFocusedToolbarIndex);
  const [focusedIndex, setFocusedIndexState] = useState(() =>
    Math.min(lastFocusedIndex, buttonCount - 1)
  );

  // Persist focus index to store
  const setFocusedIndex = useCallback((index: number) => {
    setFocusedIndexState(index);
    useUIStore.getState().setLastFocusedToolbarIndex(index);
  }, []);

  // Close toolbar action
  const closeToolbar = useCallback(() => {
    useUIStore.getState().setUniversalToolbarVisible(false);
  }, []);

  // Move focus to a button
  const focusButton = useCallback((index: number) => {
    setFocusedIndex(index);
    const container = containerRef.current;
    if (!container) return;

    const buttons = container.querySelectorAll<HTMLButtonElement>(
      ".universal-toolbar-btn"
    );
    if (buttons[index]) {
      buttons[index].focus();
    }
  }, [setFocusedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const current = focusedIndex;
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const groupModifier = isMac ? e.altKey : e.ctrlKey;

      switch (e.key) {
        case "Tab":
          e.preventDefault();
          if (e.shiftKey) {
            focusButton(getPrevButtonIndex(current, buttonCount));
          } else {
            focusButton(getNextButtonIndex(current, buttonCount));
          }
          break;

        case "ArrowRight":
          e.preventDefault();
          if (groupModifier) {
            focusButton(getNextGroupFirstIndex(current));
          } else {
            focusButton(getNextButtonIndex(current, buttonCount));
          }
          break;

        case "ArrowLeft":
          e.preventDefault();
          if (groupModifier) {
            focusButton(getPrevGroupLastIndex(current));
          } else {
            focusButton(getPrevButtonIndex(current, buttonCount));
          }
          break;

        case "Home":
          e.preventDefault();
          focusButton(getFirstButtonIndex());
          break;

        case "End":
          e.preventDefault();
          focusButton(getLastButtonIndex(buttonCount));
          break;

        case "Enter":
        case " ":
          e.preventDefault();
          onActivate(current);
          break;

        case "Escape":
          e.preventDefault();
          closeToolbar();
          break;
      }
    },
    [buttonCount, focusButton, focusedIndex, onActivate, closeToolbar]
  );

  // Focus button when toolbar opens
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const buttons = container.querySelectorAll<HTMLButtonElement>(
        ".universal-toolbar-btn"
      );
      const targetIndex = Math.min(focusedIndex, buttons.length - 1);
      if (buttons[targetIndex]) {
        buttons[targetIndex].focus();
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [focusedIndex]);

  return {
    focusedIndex,
    setFocusedIndex,
    containerRef: containerRef as React.RefObject<HTMLDivElement>,
    handleKeyDown,
  };
}
