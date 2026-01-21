import { invoke } from "@tauri-apps/api/core";
import { useWorkspaceStore, type WorkspaceConfig } from "@/stores/workspaceStore";

/**
 * Open a workspace and load config from disk (if available).
 * Returns the loaded config for optional follow-up use.
 */
export async function openWorkspaceWithConfig(
  rootPath: string
): Promise<WorkspaceConfig | null> {
  try {
    const config = await invoke<WorkspaceConfig | null>("read_workspace_config", {
      rootPath,
    });
    useWorkspaceStore.getState().openWorkspace(rootPath, config);
    return config;
  } catch (error) {
    console.error("[Workspace] Failed to load config:", error);
    useWorkspaceStore.getState().openWorkspace(rootPath);
    return null;
  }
}
