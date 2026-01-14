import { useEffect, useRef } from "react";
import { type UnlistenFn } from "@tauri-apps/api/event";
import { WebviewWindow, getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { ask } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { useEditorStore } from "@/stores/editorStore";
import { useDocumentStore } from "@/stores/documentStore";
import { useUIStore } from "@/stores/uiStore";
import { useRecentFilesStore } from "@/stores/recentFilesStore";
import { useTabStore } from "@/stores/tabStore";
import { clearAllHistory } from "@/hooks/useHistoryRecovery";
import { historyLog } from "@/utils/debug";
import { exportToHtml, exportToPdf, savePdf, copyAsHtml } from "@/hooks/useExportOperations";
import { getFileNameWithoutExtension } from "@/utils/pathUtils";
import { flushActiveWysiwygNow } from "@/utils/wysiwygFlush";
import { withReentryGuard } from "@/utils/reentryGuard";
import { getActiveDocument } from "@/utils/activeDocument";
import { resolveOpenAction } from "@/utils/openPolicy";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { invoke } from "@tauri-apps/api/core";

export function useMenuEvents() {
  const unlistenRefs = useRef<UnlistenFn[]>([]);

  useEffect(() => {
    let cancelled = false;

    const setupListeners = async () => {
      // Clean up any existing listeners first
      unlistenRefs.current.forEach((fn) => fn());
      unlistenRefs.current = [];

      if (cancelled) return;

      // Get current window for filtering - menu events include target window label
      const currentWindow = getCurrentWebviewWindow();
      const windowLabel = currentWindow.label;

      // View menu events - only respond when this window is the target
      const unlistenSourceMode = await currentWindow.listen<string>("menu:source-mode", (event) => {
        if (event.payload !== windowLabel) return;
        flushActiveWysiwygNow();
        useEditorStore.getState().toggleSourceMode();
      });
      if (cancelled) { unlistenSourceMode(); return; }
      unlistenRefs.current.push(unlistenSourceMode);

      const unlistenFocusMode = await currentWindow.listen<string>("menu:focus-mode", (event) => {
        if (event.payload !== windowLabel) return;
        useEditorStore.getState().toggleFocusMode();
      });
      if (cancelled) { unlistenFocusMode(); return; }
      unlistenRefs.current.push(unlistenFocusMode);

      const unlistenTypewriterMode = await currentWindow.listen<string>("menu:typewriter-mode", (event) => {
        if (event.payload !== windowLabel) return;
        useEditorStore.getState().toggleTypewriterMode();
      });
      if (cancelled) { unlistenTypewriterMode(); return; }
      unlistenRefs.current.push(unlistenTypewriterMode);

      const unlistenSidebar = await currentWindow.listen<string>("menu:sidebar", (event) => {
        if (event.payload !== windowLabel) return;
        useUIStore.getState().toggleSidebar();
      });
      if (cancelled) { unlistenSidebar(); return; }
      unlistenRefs.current.push(unlistenSidebar);

      const unlistenOutline = await currentWindow.listen<string>("menu:outline", (event) => {
        if (event.payload !== windowLabel) return;
        useUIStore.getState().toggleOutline();
      });
      if (cancelled) { unlistenOutline(); return; }
      unlistenRefs.current.push(unlistenOutline);

      const unlistenWordWrap = await currentWindow.listen<string>("menu:word-wrap", (event) => {
        if (event.payload !== windowLabel) return;
        useEditorStore.getState().toggleWordWrap();
      });
      if (cancelled) { unlistenWordWrap(); return; }
      unlistenRefs.current.push(unlistenWordWrap);

      const unlistenPreferences = await currentWindow.listen<string>("menu:preferences", async (event) => {
        if (event.payload !== windowLabel) return;
        // Check if settings window already exists
        const existing = await WebviewWindow.getByLabel("settings");
        if (existing) {
          await existing.setFocus();
          return;
        }
        // Create new settings window
        new WebviewWindow("settings", {
          url: "/settings",
          title: "Settings",
          width: 700,
          height: 500,
          minWidth: 500,
          minHeight: 400,
          center: true,
          resizable: true,
          hiddenTitle: true,
          titleBarStyle: "overlay",
        });
      });
      if (cancelled) { unlistenPreferences(); return; }
      unlistenRefs.current.push(unlistenPreferences);

      // History menu events
      const unlistenViewHistory = await currentWindow.listen<string>("menu:view-history", (event) => {
        if (event.payload !== windowLabel) return;
        useUIStore.getState().showSidebarWithView("history");
      });
      if (cancelled) { unlistenViewHistory(); return; }
      unlistenRefs.current.push(unlistenViewHistory);

      const unlistenClearHistory = await currentWindow.listen<string>("menu:clear-history", async (event) => {
        if (event.payload !== windowLabel) return;

        await withReentryGuard(windowLabel, "clear-history", async () => {
          const confirmed = await ask(
            "This will permanently delete all document history. This action cannot be undone.",
            {
              title: "Clear All History",
              kind: "warning",
            }
          );
          if (confirmed) {
            try {
              await clearAllHistory();
              historyLog("All history cleared");
            } catch (error) {
              console.error("[History] Failed to clear history:", error);
            }
          }
        });
      });
      if (cancelled) { unlistenClearHistory(); return; }
      unlistenRefs.current.push(unlistenClearHistory);

      // Clear Recent Files
      const unlistenClearRecent = await currentWindow.listen<string>("menu:clear-recent", async (event) => {
        if (event.payload !== windowLabel) return;

        const { files } = useRecentFilesStore.getState();
        if (files.length === 0) return;

        await withReentryGuard(windowLabel, "clear-recent", async () => {
          const confirmed = await ask(
            "Clear the list of recently opened files?",
            {
              title: "Clear Recent Files",
              kind: "warning",
            }
          );
          if (confirmed) {
            useRecentFilesStore.getState().clearAll();
          }
        });
      });
      if (cancelled) { unlistenClearRecent(); return; }
      unlistenRefs.current.push(unlistenClearRecent);

      // Open Recent File from menu - uses workspace boundary policy
      // Payload is [index, targetWindowLabel] tuple from Rust
      const unlistenOpenRecent = await currentWindow.listen<[number, string]>("menu:open-recent-file", async (event) => {
        const [index, targetLabel] = event.payload;
        if (targetLabel !== windowLabel) return;

        const { files } = useRecentFilesStore.getState();
        if (index < 0 || index >= files.length) return;

        const file = files[index];

        // Get workspace context for boundary checking
        const { isWorkspaceMode, rootPath } = useWorkspaceStore.getState();
        const existingTab = useTabStore.getState().findTabByPath(windowLabel, file.path);

        // Use policy to resolve where to open (respects workspace boundaries)
        const result = resolveOpenAction({
          filePath: file.path,
          workspaceRoot: rootPath,
          isWorkspaceMode,
          existingTabId: existingTab?.id ?? null,
        });

        await withReentryGuard(windowLabel, "open-recent", async () => {
          // Execute based on policy result
          switch (result.action) {
            case "activate_tab":
              useTabStore.getState().setActiveTab(windowLabel, result.tabId);
              break;
            case "create_tab":
              try {
                const content = await readTextFile(file.path);
                const tabId = useTabStore.getState().createTab(windowLabel, file.path);
                useDocumentStore.getState().initDocument(tabId, content, file.path);
                useRecentFilesStore.getState().addFile(file.path); // Move to top
              } catch (error) {
                console.error("[Menu] Failed to open recent file:", error);
                const remove = await ask(
                  "This file could not be opened. It may have been moved or deleted.\n\nRemove from recent files?",
                  { title: "File Not Found", kind: "warning" }
                );
                if (remove) {
                  useRecentFilesStore.getState().removeFile(file.path);
                }
              }
              break;
            case "open_workspace_in_new_window":
              // File is outside current workspace - open in new window
              try {
                await invoke("open_workspace_in_new_window", {
                  workspaceRoot: result.workspaceRoot,
                  filePath: result.filePath,
                });
              } catch (error) {
                console.error("[Menu] Failed to open workspace in new window:", error);
              }
              break;
            case "no_op":
              // Nothing to do
              break;
          }
        });
      });
      if (cancelled) { unlistenOpenRecent(); return; }
      unlistenRefs.current.push(unlistenOpenRecent);

      // Export menu events - share single "export" guard per window
      const unlistenExportHtml = await currentWindow.listen<string>("menu:export-html", async (event) => {
        if (event.payload !== windowLabel) return;
        flushActiveWysiwygNow();

        await withReentryGuard(windowLabel, "export", async () => {
          const doc = getActiveDocument(windowLabel);
          if (!doc) return;
          const defaultName = doc.filePath
            ? getFileNameWithoutExtension(doc.filePath) || "document"
            : "document";
          try {
            await exportToHtml(doc.content, defaultName);
          } catch (error) {
            console.error("[Menu] Failed to export HTML:", error);
          }
        });
      });
      if (cancelled) { unlistenExportHtml(); return; }
      unlistenRefs.current.push(unlistenExportHtml);

      const unlistenSavePdf = await currentWindow.listen<string>("menu:save-pdf", async (event) => {
        if (event.payload !== windowLabel) return;
        flushActiveWysiwygNow();

        await withReentryGuard(windowLabel, "export", async () => {
          const doc = getActiveDocument(windowLabel);
          if (!doc) return;
          const defaultName = doc.filePath
            ? getFileNameWithoutExtension(doc.filePath) || "document"
            : "document";
          try {
            await savePdf(doc.content, defaultName);
          } catch (error) {
            console.error("[Menu] Failed to save PDF:", error);
          }
        });
      });
      if (cancelled) { unlistenSavePdf(); return; }
      unlistenRefs.current.push(unlistenSavePdf);

      const unlistenExportPdf = await currentWindow.listen<string>("menu:export-pdf", async (event) => {
        if (event.payload !== windowLabel) return;
        flushActiveWysiwygNow();

        await withReentryGuard(windowLabel, "export", async () => {
          const doc = getActiveDocument(windowLabel);
          if (!doc) return;
          const title = doc.filePath
            ? getFileNameWithoutExtension(doc.filePath) || "Document"
            : "Document";
          try {
            await exportToPdf(doc.content, title);
          } catch (error) {
            console.error("[Menu] Failed to export PDF:", error);
          }
        });
      });
      if (cancelled) { unlistenExportPdf(); return; }
      unlistenRefs.current.push(unlistenExportPdf);

      const unlistenCopyHtml = await currentWindow.listen<string>("menu:copy-html", async (event) => {
        if (event.payload !== windowLabel) return;
        flushActiveWysiwygNow();

        await withReentryGuard(windowLabel, "export", async () => {
          const doc = getActiveDocument(windowLabel);
          if (!doc) return;
          try {
            await copyAsHtml(doc.content);
          } catch (error) {
            console.error("[Menu] Failed to copy HTML:", error);
          }
        });
      });
      if (cancelled) { unlistenCopyHtml(); return; }
      unlistenRefs.current.push(unlistenCopyHtml);
    };

    setupListeners();

    return () => {
      cancelled = true;
      const fns = unlistenRefs.current;
      unlistenRefs.current = [];
      fns.forEach((fn) => fn());
    };
  }, []);
}
