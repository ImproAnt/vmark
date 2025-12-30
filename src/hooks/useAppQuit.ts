import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { ask } from "@tauri-apps/plugin-dialog";
import { useDocumentStore } from "../stores/documentStore";
import { useWindowLabel } from "../contexts/WindowContext";

/**
 * Handle app quit request with confirmation for unsaved documents.
 * Only the main window handles quit confirmation to avoid duplicate dialogs.
 */
export function useAppQuit() {
  const windowLabel = useWindowLabel();

  useEffect(() => {
    // Only main window handles quit confirmation
    if (windowLabel !== "main") return;

    const handleQuitRequest = async () => {
      const dirtyWindows = useDocumentStore.getState().getAllDirtyWindows();

      if (dirtyWindows.length === 0) {
        // No unsaved documents - quit immediately
        await invoke("force_quit");
        return;
      }

      // Ask user for confirmation
      const confirmed = await ask(
        `You have ${dirtyWindows.length} unsaved document(s). Quit without saving?`,
        {
          title: "Unsaved Changes",
          kind: "warning",
          okLabel: "Quit",
          cancelLabel: "Cancel",
        }
      );

      if (confirmed) {
        await invoke("force_quit");
      }
    };

    // Global listen is fine for app-wide events
    const unlistenPromise = listen("app:quit-requested", handleQuitRequest);

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [windowLabel]);
}
