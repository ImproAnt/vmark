/**
 * Default save folder resolution
 *
 * Pure helpers for determining the default folder for Save dialogs.
 * The async wrapper that gathers data from stores/Tauri lives in hooks layer.
 *
 * Precedence:
 * 1. Workspace root (if in workspace mode)
 * 2. First saved tab's folder in the window
 * 3. Home directory
 *
 * @module utils/defaultSaveFolder
 */
import { getDirectory } from "@/utils/pathUtils";

/**
 * Input for default save folder resolution.
 * All data is pre-gathered by the caller (hook layer).
 */
export interface DefaultSaveFolderInput {
  /** Whether the window is in workspace mode */
  isWorkspaceMode: boolean;
  /** Workspace root path (if in workspace mode) */
  workspaceRoot: string | null;
  /** File paths of saved tabs in this window (in order) */
  savedFilePaths: string[];
  /** User's home directory */
  homeDirectory: string;
}

/**
 * Resolve the default save folder using three-tier precedence.
 *
 * Pure function - takes all data as input, no side effects.
 *
 * Precedence:
 * 1. Workspace root - if in workspace mode
 * 2. Saved tab folder - folder of first saved file
 * 3. Home directory - user's home folder
 *
 * @param input - Pre-gathered workspace and tab data
 * @returns The resolved default folder path
 *
 * @example
 * // In workspace mode - returns workspace root
 * resolveDefaultSaveFolder({
 *   isWorkspaceMode: true,
 *   workspaceRoot: "/workspace/project",
 *   savedFilePaths: [],
 *   homeDirectory: "/Users/test"
 * }); // Returns "/workspace/project"
 */
export function resolveDefaultSaveFolder(input: DefaultSaveFolderInput): string {
  const { isWorkspaceMode, workspaceRoot, savedFilePaths, homeDirectory } = input;

  // 1. Workspace root first
  if (isWorkspaceMode && workspaceRoot) {
    return workspaceRoot;
  }

  // 2. First saved tab's folder
  for (const filePath of savedFilePaths) {
    const dir = getDirectory(filePath);
    if (dir) return dir;
  }

  // 3. Home directory
  return homeDirectory;
}

// Note: The async wrapper getDefaultSaveFolderWithFallback is now in
// @/hooks/useDefaultSaveFolder. Import from there for Tauri/store integration.
