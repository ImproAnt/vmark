/**
 * Hook for handling Tauri file drop events for images.
 *
 * Tauri intercepts OS file drops, so we must use Tauri's onDragDropEvent
 * instead of browser's native drag-drop events.
 */

import { useEffect, useRef } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { readFile } from "@tauri-apps/plugin-fs";
import { message } from "@tauri-apps/plugin-dialog";
import type { Editor } from "@milkdown/kit/core";
import { editorViewCtx } from "@milkdown/kit/core";
import { useEditorStore } from "@/stores/editorStore";
import {
  saveImageToAssets,
  isImageFile,
  getFilename,
  insertImageNode,
} from "@/utils/imageUtils";

type GetEditor = () => Editor | undefined;

export function useImageDrop(getEditor: GetEditor) {
  const isProcessing = useRef(false);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setup = async () => {
      const webview = getCurrentWebview();

      unlisten = await webview.onDragDropEvent(async (event) => {
        // Only handle drop events (not hover/cancel)
        if (event.payload.type !== "drop") return;

        // Prevent duplicate processing
        if (isProcessing.current) return;
        isProcessing.current = true;

        try {
          const { filePath: documentPath } = useEditorStore.getState();
          const editor = getEditor();

          if (!editor) {
            isProcessing.current = false;
            return;
          }

          if (!documentPath) {
            await message(
              "Please save the document first before dropping images. " +
                "Images are stored relative to the document location.",
              { title: "Unsaved Document", kind: "warning" }
            );
            isProcessing.current = false;
            return;
          }

          // Filter for image files
          const imagePaths = event.payload.paths.filter(isImageFile);
          if (imagePaths.length === 0) {
            isProcessing.current = false;
            return;
          }

          // Process each image
          for (const imagePath of imagePaths) {
            try {
              // Read the file
              const imageData = await readFile(imagePath);
              const filename = getFilename(imagePath);

              // Save to assets folder
              const relativePath = await saveImageToAssets(
                imageData,
                filename,
                documentPath
              );

              // Insert into editor at cursor position
              editor.action((ctx) => {
                const view = ctx.get(editorViewCtx);
                insertImageNode(view, relativePath);
              });
            } catch (error) {
              console.error("Failed to process dropped image:", imagePath, error);
            }
          }
        } catch (error) {
          console.error("Failed to handle drop event:", error);
          await message("Failed to process dropped images.", { kind: "error" });
        } finally {
          isProcessing.current = false;
        }
      });
    };

    setup();

    return () => {
      unlisten?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
