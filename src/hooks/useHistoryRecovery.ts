/**
 * History Recovery (Hooks Layer)
 *
 * Async functions for recovering deleted documents:
 * - List deleted documents with history
 * - Restore deleted documents
 * - Permanently delete history
 *
 * Uses Tauri APIs for file system access.
 * Types are in utils/historyTypes.
 */

import {
  exists,
  readTextFile,
  writeTextFile,
  readDir,
  remove,
} from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import { historyLog } from "@/utils/debug";
import {
  type HistoryIndex,
  type DeletedDocument,
  INDEX_FILE,
  getDocumentName,
} from "@/utils/historyTypes";
import { getHistoryBaseDir } from "@/hooks/useHistoryOperations";

// Re-export type for consumers
export type { DeletedDocument };

/**
 * Get all deleted documents that have history
 */
export async function getDeletedDocuments(): Promise<DeletedDocument[]> {
  try {
    const baseDir = await getHistoryBaseDir();
    if (!(await exists(baseDir))) return [];

    const entries = await readDir(baseDir);
    const deleted: DeletedDocument[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory) continue;

      try {
        const indexPath = await join(baseDir, entry.name, INDEX_FILE);
        if (!(await exists(indexPath))) continue;

        const content = await readTextFile(indexPath);
        const index = JSON.parse(content) as HistoryIndex;

        if (index.status === "deleted" && index.snapshots.length > 0) {
          const latestSnapshot = index.snapshots[index.snapshots.length - 1];
          deleted.push({
            pathHash: index.pathHash,
            documentName: index.documentName,
            lastPath: index.documentPath,
            deletedAt: index.deletedAt || 0,
            snapshotCount: index.snapshots.length,
            latestPreview: latestSnapshot.preview,
          });
        }
      } catch {
        // Skip invalid entries
      }
    }

    // Sort by deletion date descending
    return deleted.sort((a, b) => b.deletedAt - a.deletedAt);
  } catch (error) {
    console.error("[History] Failed to get deleted documents:", error);
    return [];
  }
}

/**
 * Restore a deleted document's latest version to a new path
 */
export async function restoreDeletedDocument(
  pathHash: string,
  newPath: string
): Promise<string | null> {
  try {
    const baseDir = await getHistoryBaseDir();
    const historyDir = await join(baseDir, pathHash);
    const indexPath = await join(historyDir, INDEX_FILE);

    if (!(await exists(indexPath))) {
      console.error("[History] No history found for hash:", pathHash);
      return null;
    }

    const content = await readTextFile(indexPath);
    const index = JSON.parse(content) as HistoryIndex;

    if (index.snapshots.length === 0) {
      console.error("[History] No snapshots to restore");
      return null;
    }

    // Get latest snapshot
    const latestSnapshot = index.snapshots[index.snapshots.length - 1];
    const snapshotPath = await join(historyDir, `${latestSnapshot.id}.md`);
    const snapshotContent = await readTextFile(snapshotPath);

    // Update index with new path
    index.documentPath = newPath;
    index.documentName = getDocumentName(newPath);
    index.status = "active";
    index.deletedAt = null;

    // Save updated index (note: still at old hash location)
    await writeTextFile(indexPath, JSON.stringify(index, null, 2));

    historyLog("Restored document to:", newPath);
    return snapshotContent;
  } catch (error) {
    console.error("[History] Failed to restore document:", error);
    return null;
  }
}

/**
 * Permanently delete history for a document
 */
export async function deleteHistory(pathHash: string): Promise<void> {
  try {
    const baseDir = await getHistoryBaseDir();
    const historyDir = await join(baseDir, pathHash);

    if (await exists(historyDir)) {
      await remove(historyDir, { recursive: true });
      historyLog("Deleted history for:", pathHash);
    }
  } catch (error) {
    console.error("[History] Failed to delete history:", error);
  }
}

/**
 * Clear all history
 */
export async function clearAllHistory(): Promise<void> {
  try {
    const baseDir = await getHistoryBaseDir();
    if (await exists(baseDir)) {
      await remove(baseDir, { recursive: true });
      historyLog("Cleared all history");
    }
  } catch (error) {
    console.error("[History] Failed to clear all history:", error);
  }
}
