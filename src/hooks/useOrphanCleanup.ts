/**
 * Hook for Orphan Asset Cleanup
 *
 * Provides a function to clean up unused images from the active document's
 * assets folder. Can be triggered via menu event or keyboard shortcut.
 *
 * @module hooks/useOrphanCleanup
 */

import { useCallback } from "react";
import { useWindowLabel } from "@/contexts/WindowContext";
import { useTabStore } from "@/stores/tabStore";
import { useDocumentStore } from "@/stores/documentStore";
import { runOrphanCleanup } from "@/utils/orphanAssetCleanup";

/**
 * Hook that returns a cleanup function for the active document's orphaned images.
 */
export function useOrphanCleanup() {
  const windowLabel = useWindowLabel();

  const cleanupOrphanedImages = useCallback(async (): Promise<number> => {
    // Get active document
    const tabId = useTabStore.getState().activeTabId[windowLabel];
    if (!tabId) {
      console.warn("[OrphanCleanup] No active tab");
      return -1;
    }

    const doc = useDocumentStore.getState().getDocument(tabId);
    if (!doc) {
      console.warn("[OrphanCleanup] No document found");
      return -1;
    }

    return runOrphanCleanup(doc.filePath, doc.content);
  }, [windowLabel]);

  return { cleanupOrphanedImages };
}
