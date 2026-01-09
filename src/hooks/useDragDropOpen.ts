/**
 * Hook for handling drag-and-drop file opening
 *
 * Listens to Tauri's drag-drop events and opens dropped markdown files.
 * Files within the current workspace open in new tabs; files outside
 * the workspace open in a new window.
 *
 * @module hooks/useDragDropOpen
 */
import { useEffect, useRef } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import { useWindowLabel } from "@/contexts/WindowContext";
import { useTabStore } from "@/stores/tabStore";
import { useDocumentStore } from "@/stores/documentStore";
import { useRecentFilesStore } from "@/stores/recentFilesStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { filterMarkdownPaths } from "@/utils/dropPaths";
import { shouldClaimFile } from "@/utils/fileOwnership";
import { getDirectory } from "@/utils/pathUtils";
import { isWithinRoot } from "@/utils/paths";

/**
 * Opens a file in a new tab.
 *
 * @param windowLabel - The window to open the file in
 * @param path - The file path to open
 */
async function openFileInNewTab(windowLabel: string, path: string): Promise<void> {
  try {
    const content = await readTextFile(path);
    const tabId = useTabStore.getState().createTab(windowLabel, path);
    useDocumentStore.getState().initDocument(tabId, content, path);
    useRecentFilesStore.getState().addFile(path);
  } catch (error) {
    console.error("[DragDrop] Failed to open file:", path, error);
  }
}

/**
 * Hook to handle drag-and-drop file opening.
 *
 * When markdown files (.md, .markdown, .txt) are dropped onto the window,
 * they are opened in new tabs. Non-markdown files are silently ignored.
 *
 * @example
 * function DocumentWindow() {
 *   useDragDropOpen();
 *   return <Editor />;
 * }
 */
export function useDragDropOpen(): void {
  const windowLabel = useWindowLabel();
  const unlistenRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;

    const setupDragDrop = async () => {
      const webview = getCurrentWebview();

      const unlisten = await webview.onDragDropEvent(async (event) => {
        if (cancelled) return;

        // Only handle drop events (not hover/leave)
        if (event.payload.type !== "drop") return;

        const paths = event.payload.paths;
        const markdownPaths = filterMarkdownPaths(paths);

        // Get current workspace state to determine ownership
        const { isWorkspaceMode, rootPath } = useWorkspaceStore.getState();

        // Get current file's folder as implicit boundary when not in workspace mode
        const activeTabId = useTabStore.getState().activeTabId[windowLabel];
        const currentDoc = activeTabId
          ? useDocumentStore.getState().getDocument(activeTabId)
          : null;
        const currentFileFolder = currentDoc?.filePath
          ? getDirectory(currentDoc.filePath)
          : null;

        // Open each markdown file, respecting workspace/folder boundaries
        await Promise.all(
          markdownPaths.map(async (path) => {
            let shouldOpenHere = false;

            if (isWorkspaceMode && rootPath) {
              // Explicit workspace mode - use workspace boundary
              const ownership = shouldClaimFile({
                filePath: path,
                isWorkspaceMode,
                workspaceRoot: rootPath,
              });
              shouldOpenHere = ownership.shouldClaim;
            } else if (currentFileFolder) {
              // No workspace but have a file open - use file's folder as boundary
              shouldOpenHere = isWithinRoot(currentFileFolder, path);
            } else {
              // No workspace, no file open - accept all drops
              shouldOpenHere = true;
            }

            if (shouldOpenHere) {
              // File is within boundary - open in this window
              await openFileInNewTab(windowLabel, path);
            } else {
              // File is outside boundary - open in a new window
              try {
                await invoke("open_file_in_new_window", { path });
              } catch (error) {
                console.error("[DragDrop] Failed to open in new window:", path, error);
              }
            }
          })
        );
      });

      if (cancelled) {
        unlisten();
        return;
      }

      unlistenRef.current = unlisten;
    };

    setupDragDrop();

    return () => {
      cancelled = true;
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }
    };
  }, [windowLabel]);
}
