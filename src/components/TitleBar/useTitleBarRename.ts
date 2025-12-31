import { useState, useCallback, useRef } from "react";
import { rename, exists } from "@tauri-apps/plugin-fs";
import { join, basename } from "@tauri-apps/api/path";
import { useDocumentActions } from "@/hooks/useDocumentState";

export function useTitleBarRename() {
  const [isRenaming, setIsRenaming] = useState(false);
  const { setFilePath } = useDocumentActions();
  const isRenamingRef = useRef(false);

  const renameFile = useCallback(
    async (oldPath: string, newName: string): Promise<boolean> => {
      // Guard against re-entry
      if (isRenamingRef.current) return false;
      isRenamingRef.current = true;
      setIsRenaming(true);

      try {
        const oldName = await basename(oldPath);
        const parentPath = oldPath.slice(0, -oldName.length - 1);

        // Ensure .md extension
        const finalName = newName.endsWith(".md") ? newName : `${newName}.md`;
        const newPath = await join(parentPath, finalName);

        // No change needed
        if (oldPath === newPath) return true;

        // Check if target exists
        if (await exists(newPath)) {
          console.warn("[TitleBar] Target file already exists:", newPath);
          return false;
        }

        // Perform rename
        await rename(oldPath, newPath);

        // Update document store with new path
        setFilePath(newPath);

        return true;
      } catch (error) {
        console.error("[TitleBar] Failed to rename file:", error);
        return false;
      } finally {
        isRenamingRef.current = false;
        setIsRenaming(false);
      }
    },
    [setFilePath]
  );

  return { renameFile, isRenaming };
}
