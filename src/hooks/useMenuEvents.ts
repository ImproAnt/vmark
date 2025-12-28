import { useEffect, useRef } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useEditorStore } from "@/stores/editorStore";
import { useUIStore } from "@/stores/uiStore";

export function useMenuEvents() {
  const unlistenRefs = useRef<UnlistenFn[]>([]);

  useEffect(() => {
    const setupListeners = async () => {
      // Clean up any existing listeners first
      unlistenRefs.current.forEach((fn) => fn());
      unlistenRefs.current = [];

      // View menu events
      const unlistenSourceMode = await listen("menu:source-mode", () => {
        useEditorStore.getState().toggleSourceMode();
      });
      unlistenRefs.current.push(unlistenSourceMode);

      const unlistenFocusMode = await listen("menu:focus-mode", () => {
        useEditorStore.getState().toggleFocusMode();
      });
      unlistenRefs.current.push(unlistenFocusMode);

      const unlistenTypewriterMode = await listen("menu:typewriter-mode", () => {
        useEditorStore.getState().toggleTypewriterMode();
      });
      unlistenRefs.current.push(unlistenTypewriterMode);

      const unlistenSidebar = await listen("menu:sidebar", () => {
        useUIStore.getState().toggleSidebar();
      });
      unlistenRefs.current.push(unlistenSidebar);

      const unlistenOutline = await listen("menu:outline", () => {
        useUIStore.getState().toggleOutline();
      });
      unlistenRefs.current.push(unlistenOutline);
    };

    setupListeners();

    return () => {
      unlistenRefs.current.forEach((fn) => fn());
      unlistenRefs.current = [];
    };
  }, []);
}
