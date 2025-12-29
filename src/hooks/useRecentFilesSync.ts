/**
 * Hook to sync recent files to native menu on app startup.
 *
 * The persist middleware's onRehydrateStorage runs before Tauri APIs are ready,
 * so we need this hook to sync after the app is fully loaded.
 */

import { useEffect } from "react";
import { useRecentFilesStore } from "@/stores/recentFilesStore";

export function useRecentFilesSync() {
  useEffect(() => {
    // Sync recent files to native menu on mount
    useRecentFilesStore.getState().syncToNativeMenu();
  }, []);
}
