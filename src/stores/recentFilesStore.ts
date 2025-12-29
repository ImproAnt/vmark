/**
 * Recent Files Store
 *
 * Tracks recently opened files with persistence across sessions.
 * Syncs with native menu via Tauri command.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { invoke } from "@tauri-apps/api/core";

export interface RecentFile {
  path: string;
  name: string;
  timestamp: number;
}

interface RecentFilesState {
  files: RecentFile[];
  maxFiles: number;
  addFile: (path: string) => void;
  removeFile: (path: string) => void;
  clearAll: () => void;
  syncToNativeMenu: () => void;
}

// Helper to sync files to native menu
async function updateNativeMenu(files: RecentFile[]) {
  try {
    await invoke("update_recent_files", { files: files.map((f) => f.path) });
  } catch (error) {
    console.warn("[RecentFiles] Failed to update native menu:", error);
  }
}

export const useRecentFilesStore = create<RecentFilesState>()(
  persist(
    (set, get) => ({
      files: [],
      maxFiles: 10,

      addFile: (path: string) => {
        const { files, maxFiles } = get();
        const name = path.split("/").pop() || path;

        // Remove if already exists (will be re-added at top)
        const filtered = files.filter((f) => f.path !== path);

        // Add to front
        const newFiles = [
          { path, name, timestamp: Date.now() },
          ...filtered,
        ].slice(0, maxFiles);

        set({ files: newFiles });
        updateNativeMenu(newFiles);
      },

      removeFile: (path: string) => {
        const newFiles = get().files.filter((f) => f.path !== path);
        set({ files: newFiles });
        updateNativeMenu(newFiles);
      },

      clearAll: () => {
        set({ files: [] });
        updateNativeMenu([]);
      },

      syncToNativeMenu: () => {
        updateNativeMenu(get().files);
      },
    }),
    {
      name: "vmark-recent-files",
    }
  )
);
