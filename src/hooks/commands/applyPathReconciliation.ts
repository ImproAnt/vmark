/**
 * Apply Path Reconciliation Results
 *
 * Takes reconciliation results from the pure helper and applies
 * them to the tab and document stores.
 */

import { useTabStore } from "@/stores/tabStore";
import { useDocumentStore } from "@/stores/documentStore";
import type { ReconcileResult } from "@/utils/pathReconciliation";
import { normalizePath } from "@/utils/paths";

/**
 * Apply reconciliation results to update open tabs and documents.
 *
 * For update_path: Updates both tab path and document filePath.
 * For mark_missing: Sets isMissing flag on document.
 *
 * @param results - Results from reconcilePathChange
 */
export function applyPathReconciliation(results: ReconcileResult[]): void {
  const tabStore = useTabStore.getState();
  const docStore = useDocumentStore.getState();

  for (const result of results) {
    const targetPath = normalizePath(result.oldPath);
    if (result.action === "update_path") {
      const newPath = normalizePath(result.newPath);
      for (const windowTabs of Object.values(tabStore.tabs)) {
        for (const tab of windowTabs) {
          if (tab.filePath && normalizePath(tab.filePath) === targetPath) {
            tabStore.updateTabPath(tab.id, newPath);
            docStore.setFilePath(tab.id, newPath);
          }
        }
      }
    } else if (result.action === "mark_missing") {
      for (const windowTabs of Object.values(tabStore.tabs)) {
        for (const tab of windowTabs) {
          if (tab.filePath && normalizePath(tab.filePath) === targetPath) {
            docStore.markMissing(tab.id);
          }
        }
      }
    }
  }
}
