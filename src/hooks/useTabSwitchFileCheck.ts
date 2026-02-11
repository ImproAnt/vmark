/**
 * Hook to check for stale file content when switching tabs.
 *
 * In non-workspace mode, the file watcher only monitors the active tab's
 * directory. External changes to files in other directories are missed when
 * those tabs are in the background. This hook compensates by reading the
 * file from disk whenever a tab becomes active and comparing it against
 * lastDiskContent.
 *
 * @module hooks/useTabSwitchFileCheck
 */
import { useEffect, useRef } from "react";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { toast } from "sonner";
import { useWindowLabel } from "@/contexts/WindowContext";
import { useTabStore } from "@/stores/tabStore";
import { useDocumentStore } from "@/stores/documentStore";
import { resolveExternalChangeAction } from "@/utils/openPolicy";
import { matchesPendingSave } from "@/utils/pendingSaves";
import { detectLinebreaks } from "@/utils/linebreakDetection";
import { getFileName } from "@/utils/paths";
import { saveToPath } from "@/utils/saveToPath";
import { message, save } from "@tauri-apps/plugin-dialog";

/** Small delay to avoid blocking the tab switch animation (ms) */
const TAB_SWITCH_CHECK_DELAY_MS = 50;

/**
 * Check for stale file content when the active tab changes.
 *
 * Reads the file from disk and compares with lastDiskContent.
 * Handles external changes the same way useExternalFileChanges does.
 */
export function useTabSwitchFileCheck(): void {
  const windowLabel = useWindowLabel();
  const activeTabId = useTabStore(
    (state) => state.activeTabId[windowLabel] ?? null
  );
  const prevTabIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Skip if same tab or no tab
    if (!activeTabId || activeTabId === prevTabIdRef.current) {
      prevTabIdRef.current = activeTabId;
      return;
    }

    prevTabIdRef.current = activeTabId;
    const tabId = activeTabId;

    const timer = setTimeout(async () => {
      const doc = useDocumentStore.getState().getDocument(tabId);
      if (!doc?.filePath) return;

      const filePath = doc.filePath;

      let diskContent: string;
      try {
        diskContent = await readTextFile(filePath);
      } catch {
        // File unreadable (deleted or moved) — mark as missing
        useDocumentStore.getState().markMissing(tabId);
        return;
      }

      // Skip if content matches what we last saw on disk
      if (diskContent === doc.lastDiskContent) return;

      // Skip if this is our own pending save
      if (matchesPendingSave(filePath, diskContent)) return;

      // Real external change detected
      const action = resolveExternalChangeAction({
        isDirty: doc.isDirty,
        hasFilePath: true,
      });

      switch (action) {
        case "auto_reload":
          useDocumentStore
            .getState()
            .loadContent(
              tabId,
              diskContent,
              filePath,
              detectLinebreaks(diskContent)
            );
          useDocumentStore.getState().clearMissing(tabId);
          toast.info(`Reloaded: ${getFileName(filePath)}`);
          break;

        case "prompt_user": {
          const fileName = getFileName(filePath) || "file";

          const result = await message(
            `"${fileName}" has been modified externally.\n\n` +
              "What would you like to do?",
            {
              title: "File Changed",
              kind: "warning",
              buttons: {
                yes: "Save As...",
                no: "Reload",
                cancel: "Keep my changes",
              },
            }
          );

          if (result === "Yes" || result === "Save As...") {
            const currentDoc = useDocumentStore.getState().getDocument(tabId);
            if (currentDoc) {
              const savePath = await save({
                title: "Save your version as...",
                defaultPath: filePath,
                filters: [
                  { name: "Markdown", extensions: ["md", "markdown"] },
                ],
              });
              if (savePath) {
                const saved = await saveToPath(
                  tabId,
                  savePath,
                  currentDoc.content,
                  "manual"
                );
                if (saved) {
                  useDocumentStore.getState().clearMissing(tabId);
                }
              }
            }
          } else if (result === "No" || result === "Reload") {
            try {
              const freshContent = await readTextFile(filePath);
              useDocumentStore
                .getState()
                .loadContent(
                  tabId,
                  freshContent,
                  filePath,
                  detectLinebreaks(freshContent)
                );
              useDocumentStore.getState().clearMissing(tabId);
            } catch {
              useDocumentStore.getState().markMissing(tabId);
            }
          } else {
            // Cancel / Keep my changes
            useDocumentStore.getState().markDivergent(tabId);
          }
          break;
        }

        case "no_op":
          break;
      }
    }, TAB_SWITCH_CHECK_DELAY_MS);

    return () => clearTimeout(timer);
  }, [activeTabId, windowLabel]);
}
