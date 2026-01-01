import { useEffect } from "react";

/**
 * Disables the default browser context menu (with "Reload", "Inspect", etc.)
 * Custom context menus should call e.preventDefault() before this handler runs.
 *
 * In development mode, the browser context menu is allowed for debugging.
 */
export function useDisableContextMenu() {
  useEffect(() => {
    // In dev mode, allow browser context menu for debugging (Reload, Inspect, etc.)
    if (import.meta.env.DEV) return;

    const handleContextMenu = (e: MouseEvent) => {
      // Allow custom context menus that already called preventDefault
      if (e.defaultPrevented) return;

      // Block the default browser context menu
      e.preventDefault();
    };

    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, []);
}
