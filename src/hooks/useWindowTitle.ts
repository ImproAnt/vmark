import { useEffect } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useDocumentFilePath, useDocumentIsDirty } from "./useDocumentState";
import { getFileName } from "@/utils/pathUtils";

/**
 * Update window title based on document state.
 * Format: [* ]filename - VMark
 */
export function useWindowTitle() {
  const filePath = useDocumentFilePath();
  const isDirty = useDocumentIsDirty();

  useEffect(() => {
    const updateTitle = async () => {
      const window = getCurrentWebviewWindow();

      // Extract filename from path or use "Untitled"
      const filename = filePath ? getFileName(filePath) || "Untitled" : "Untitled";

      // Add dirty indicator
      const dirtyIndicator = isDirty ? "• " : "";
      const title = `${dirtyIndicator}${filename} - VMark`;

      await window.setTitle(title);
    };

    updateTitle();
  }, [filePath, isDirty]);
}
