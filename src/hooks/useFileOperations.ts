import { useEffect, useCallback, useRef } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { open, save, ask } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { useEditorStore } from "@/stores/editorStore";

async function saveToPath(path: string, content: string): Promise<boolean> {
  try {
    await writeTextFile(path, content);
    useEditorStore.getState().setFilePath(path);
    useEditorStore.getState().markSaved();
    return true;
  } catch (error) {
    console.error("Failed to save file:", error);
    return false;
  }
}

export function useFileOperations() {
  const handleNew = useCallback(async () => {
    const { isDirty } = useEditorStore.getState();
    if (isDirty) {
      const confirmed = await ask("You have unsaved changes. Discard them?", {
        title: "Unsaved Changes",
        kind: "warning",
      });
      if (!confirmed) return;
    }
    useEditorStore.getState().reset();
  }, []);

  const handleOpen = useCallback(async () => {
    const { isDirty } = useEditorStore.getState();
    if (isDirty) {
      const confirmed = await ask("You have unsaved changes. Discard them?", {
        title: "Unsaved Changes",
        kind: "warning",
      });
      if (!confirmed) return;
    }
    try {
      const path = await open({
        filters: [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }],
      });
      if (path) {
        const content = await readTextFile(path);
        useEditorStore.getState().loadContent(content, path);
      }
    } catch (error) {
      console.error("Failed to open file:", error);
    }
  }, []);

  const handleSave = useCallback(async () => {
    const { content, filePath } = useEditorStore.getState();
    if (filePath) {
      try {
        await writeTextFile(filePath, content);
        useEditorStore.getState().markSaved();
      } catch (error) {
        console.error("Failed to save file:", error);
      }
    } else {
      const path = await save({
        filters: [{ name: "Markdown", extensions: ["md"] }],
      });
      if (path) {
        await saveToPath(path, content);
      }
    }
  }, []);

  const handleSaveAs = useCallback(async () => {
    const path = await save({
      filters: [{ name: "Markdown", extensions: ["md"] }],
    });
    if (path) {
      const { content } = useEditorStore.getState();
      await saveToPath(path, content);
    }
  }, []);

  const handleClose = useCallback(async () => {
    const { isDirty } = useEditorStore.getState();
    if (isDirty) {
      const confirmed = await ask("You have unsaved changes. Discard them?", {
        title: "Unsaved Changes",
        kind: "warning",
      });
      if (!confirmed) return;
    }
    useEditorStore.getState().reset();
  }, []);

  const unlistenRefs = useRef<UnlistenFn[]>([]);

  useEffect(() => {
    let cancelled = false;

    const setupListeners = async () => {
      // Clean up any existing listeners first
      unlistenRefs.current.forEach((fn) => fn());
      unlistenRefs.current = [];

      if (cancelled) return;

      const unlistenNew = await listen("menu:new", handleNew);
      if (cancelled) { unlistenNew(); return; }
      unlistenRefs.current.push(unlistenNew);

      const unlistenOpen = await listen("menu:open", handleOpen);
      if (cancelled) { unlistenOpen(); return; }
      unlistenRefs.current.push(unlistenOpen);

      const unlistenSave = await listen("menu:save", handleSave);
      if (cancelled) { unlistenSave(); return; }
      unlistenRefs.current.push(unlistenSave);

      const unlistenSaveAs = await listen("menu:save-as", handleSaveAs);
      if (cancelled) { unlistenSaveAs(); return; }
      unlistenRefs.current.push(unlistenSaveAs);

      const unlistenClose = await listen("menu:close", handleClose);
      if (cancelled) { unlistenClose(); return; }
      unlistenRefs.current.push(unlistenClose);
    };

    setupListeners();

    return () => {
      cancelled = true;
      const fns = unlistenRefs.current;
      unlistenRefs.current = [];
      fns.forEach((fn) => fn());
    };
  }, [handleNew, handleOpen, handleSave, handleSaveAs, handleClose]);
}
