import { useEffect } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useDocumentFilePath, useDocumentIsDirty } from "./useDocumentState";

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
      let filename = "Untitled";
      if (filePath) {
        const parts = filePath.split("/");
        filename = parts[parts.length - 1] || "Untitled";
      }

      // Add dirty indicator
      const dirtyIndicator = isDirty ? "• " : "";
      const title = `${dirtyIndicator}${filename} - VMark`;

      await window.setTitle(title);
    };

    updateTitle();
  }, [filePath, isDirty]);
}
