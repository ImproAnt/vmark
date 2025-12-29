/**
 * Image Handler Plugin
 *
 * ProseMirror plugin for handling image paste and drag-drop.
 * Saves images to ./assets/images/ relative to the document.
 */

import { $prose } from "@milkdown/kit/utils";
import { Plugin, PluginKey } from "@milkdown/kit/prose/state";
import type { EditorView } from "@milkdown/kit/prose/view";
import { message } from "@tauri-apps/plugin-dialog";
import { useEditorStore } from "@/stores/editorStore";
import { saveImageToAssets } from "@/utils/imageUtils";

export const imageHandlerPluginKey = new PluginKey("imageHandler");

/**
 * Show warning when document is unsaved.
 */
async function showUnsavedWarning(): Promise<void> {
  await message(
    "Please save the document first before inserting images. " +
      "Images are stored relative to the document location.",
    { title: "Unsaved Document", kind: "warning" }
  );
}

/**
 * Insert image node at cursor or specified position.
 */
function insertImageNode(
  view: EditorView,
  imagePath: string,
  insertPos?: number
): void {
  const { state } = view;
  const pos = insertPos ?? state.selection.from;

  // Get the image node type from schema
  const imageType = state.schema.nodes.image;
  if (!imageType) {
    console.error("Image node type not found in schema");
    return;
  }

  // Create image node with src attribute
  const imageNode = imageType.create({
    src: imagePath,
    alt: "",
    title: "",
  });

  // Insert the node
  const tr = state.tr.insert(pos, imageNode);
  view.dispatch(tr);
}


/**
 * Process clipboard image item.
 */
async function processClipboardImage(
  view: EditorView,
  item: DataTransferItem
): Promise<void> {
  const { filePath } = useEditorStore.getState();

  if (!filePath) {
    await showUnsavedWarning();
    return;
  }

  try {
    const file = item.getAsFile();
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const imageData = new Uint8Array(buffer);
    const filename = file.name || "clipboard-image.png";

    // Save image and get relative path (portable)
    const relativePath = await saveImageToAssets(imageData, filename, filePath);
    // Insert with relative path - imageViewPlugin will resolve for rendering
    insertImageNode(view, relativePath);
  } catch (error) {
    console.error("Failed to process clipboard image:", error);
    await message("Failed to save image from clipboard.", { kind: "error" });
  }
}

/**
 * Process dropped image file.
 */
async function processDroppedFile(
  view: EditorView,
  file: File,
  insertPos?: number
): Promise<void> {
  const { filePath } = useEditorStore.getState();

  if (!filePath) {
    await showUnsavedWarning();
    return;
  }

  try {
    const buffer = await file.arrayBuffer();
    const imageData = new Uint8Array(buffer);

    // Save image and get relative path (portable)
    const relativePath = await saveImageToAssets(imageData, file.name, filePath);
    // Insert with relative path - imageViewPlugin will resolve for rendering
    insertImageNode(view, relativePath, insertPos);
  } catch (error) {
    console.error("Failed to process dropped image:", error);
    await message("Failed to save dropped image.", { kind: "error" });
  }
}

/**
 * Handle paste event - check for images in clipboard.
 */
function handlePaste(view: EditorView, event: ClipboardEvent): boolean {
  const items = event.clipboardData?.items;
  if (!items) return false;

  for (const item of items) {
    if (item.type.startsWith("image/")) {
      event.preventDefault();
      processClipboardImage(view, item);
      return true;
    }
  }

  return false;
}

/**
 * Handle drop event - check for image files.
 */
function handleDrop(view: EditorView, event: DragEvent): boolean {
  const files = event.dataTransfer?.files;
  if (!files || files.length === 0) return false;

  // Find image files
  const imageFiles: File[] = [];
  for (const file of files) {
    if (file.type.startsWith("image/")) {
      imageFiles.push(file);
    }
  }

  if (imageFiles.length === 0) return false;

  event.preventDefault();

  // Get drop position
  const pos = view.posAtCoords({
    left: event.clientX,
    top: event.clientY,
  });

  // Process each image file
  for (const file of imageFiles) {
    processDroppedFile(view, file, pos?.pos);
  }

  return true;
}

/**
 * Milkdown plugin for image paste and drag-drop handling.
 */
export const imageHandlerPlugin = $prose(() => {
  return new Plugin({
    key: imageHandlerPluginKey,

    props: {
      handlePaste,
      handleDrop,
    },
  });
});

export default imageHandlerPlugin;
