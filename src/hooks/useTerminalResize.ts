import { useCallback, useRef, useEffect } from "react";
import {
  useTerminalStore,
  TERMINAL_MIN_HEIGHT,
  TERMINAL_MAX_HEIGHT,
  TERMINAL_MIN_WIDTH,
  TERMINAL_MAX_WIDTH,
} from "@/stores/terminalStore";
import { useSettingsStore } from "@/stores/settingsStore";

/**
 * Hook for handling terminal panel resize via drag handle.
 *
 * Features:
 * - Supports both vertical (bottom) and horizontal (right) resize
 * - Clamps size to MIN/MAX bounds
 * - Cleans up listeners on blur/unmount to prevent leaks
 * - Prevents text selection during drag
 * - Inverts drag direction appropriately for each position
 *
 * @returns handleResizeStart - onMouseDown handler for the resize handle
 */
export function useTerminalResize() {
  const isResizing = useRef(false);
  const startPos = useRef(0);
  const startSize = useRef(0);

  // Store references for cleanup
  const handlersRef = useRef<{
    move: ((e: MouseEvent) => void) | null;
    up: (() => void) | null;
  }>({ move: null, up: null });

  /** Clamp height to valid range */
  const clampHeight = useCallback((height: number): number => {
    return Math.max(TERMINAL_MIN_HEIGHT, Math.min(TERMINAL_MAX_HEIGHT, height));
  }, []);

  /** Clamp width to valid range */
  const clampWidth = useCallback((width: number): number => {
    return Math.max(TERMINAL_MIN_WIDTH, Math.min(TERMINAL_MAX_WIDTH, width));
  }, []);

  /** Clean up listeners and styles */
  const cleanup = useCallback(() => {
    isResizing.current = false;
    if (handlersRef.current.move) {
      document.removeEventListener("mousemove", handlersRef.current.move);
    }
    if (handlersRef.current.up) {
      document.removeEventListener("mouseup", handlersRef.current.up);
      window.removeEventListener("blur", handlersRef.current.up);
    }
    handlersRef.current = { move: null, up: null };
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isResizing.current = true;

      const position = useSettingsStore.getState().terminal.position;
      const isHorizontal = position === "right";

      if (isHorizontal) {
        startPos.current = e.clientX;
        startSize.current = useTerminalStore.getState().width;
      } else {
        startPos.current = e.clientY;
        startSize.current = useTerminalStore.getState().height;
      }

      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing.current) return;

        if (isHorizontal) {
          // Horizontal resize: dragging left (negative delta) should increase width
          const delta = startPos.current - e.clientX;
          const newWidth = clampWidth(startSize.current + delta);
          useTerminalStore.getState().setWidth(newWidth);
        } else {
          // Vertical resize: dragging up (negative delta) should increase height
          const delta = startPos.current - e.clientY;
          const newHeight = clampHeight(startSize.current + delta);
          useTerminalStore.getState().setHeight(newHeight);
        }
      };

      const handleMouseUp = () => {
        cleanup();
      };

      // Store references for cleanup
      handlersRef.current = { move: handleMouseMove, up: handleMouseUp };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      // Also cleanup on window blur (user switches away mid-drag)
      window.addEventListener("blur", handleMouseUp);

      document.body.style.cursor = isHorizontal ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";
    },
    [clampHeight, clampWidth, cleanup]
  );

  return handleResizeStart;
}
