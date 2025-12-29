/**
 * Image Utilities
 *
 * File operations for handling images in the editor.
 * Saves images to ./assets/images/ relative to the document.
 */

import { mkdir, exists, copyFile, writeFile } from "@tauri-apps/plugin-fs";
import { dirname, join } from "@tauri-apps/api/path";
import type { EditorView } from "@milkdown/kit/prose/view";

const ASSETS_FOLDER = "assets/images";

/**
 * Supported image extensions.
 */
export const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"];

/**
 * Check if a filename has an image extension.
 */
export function isImageFile(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext || "");
}

/**
 * Extract filename from a path (handles both / and \ separators).
 */
export function getFilename(path: string): string {
  return path.split(/[/\\]/).pop() || "image.png";
}

/**
 * Generate a unique filename using timestamp and random suffix.
 * Format: {basename}-{timestamp}-{random4}.{ext}
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);

  // Extract and sanitize base name
  const baseName = originalName
    .replace(/\.[^.]+$/, "") // Remove extension
    .replace(/[^a-zA-Z0-9-_]/g, "_") // Replace special chars
    .substring(0, 50); // Limit length

  // Get extension
  const ext = originalName.split(".").pop()?.toLowerCase() || "png";

  return `${baseName}-${timestamp}-${random}.${ext}`;
}

/**
 * Get the assets folder path relative to the document.
 */
export async function getAssetsFolder(documentPath: string): Promise<string> {
  const docDir = await dirname(documentPath);
  return join(docDir, ASSETS_FOLDER);
}

/**
 * Ensure the assets folder exists, creating it if necessary.
 */
export async function ensureAssetsFolder(documentPath: string): Promise<string> {
  const assetsPath = await getAssetsFolder(documentPath);

  const assetsExists = await exists(assetsPath);
  if (!assetsExists) {
    await mkdir(assetsPath, { recursive: true });
  }

  return assetsPath;
}

/**
 * Save image data (from clipboard or drag) to the assets folder.
 * Returns the relative path for markdown insertion.
 */
export async function saveImageToAssets(
  imageData: Uint8Array,
  originalFilename: string,
  documentPath: string
): Promise<string> {
  const assetsPath = await ensureAssetsFolder(documentPath);
  const filename = generateUniqueFilename(originalFilename);
  const destPath = await join(assetsPath, filename);

  await writeFile(destPath, imageData);

  return `./${ASSETS_FOLDER}/${filename}`;
}

/**
 * Copy an external image file to the assets folder.
 * Used by "Insert Image" menu and drag-drop of file paths.
 */
export async function copyImageToAssets(
  sourcePath: string,
  documentPath: string
): Promise<string> {
  const assetsPath = await ensureAssetsFolder(documentPath);
  const originalName = getFilename(sourcePath);
  const filename = generateUniqueFilename(originalName);
  const destPath = await join(assetsPath, filename);

  await copyFile(sourcePath, destPath);

  return `./${ASSETS_FOLDER}/${filename}`;
}

/**
 * Insert an image node into the ProseMirror editor.
 * Used by both paste handler and drag-drop handler.
 */
export function insertImageNode(
  view: EditorView,
  src: string,
  pos?: number
): void {
  const { state } = view;
  const imageType = state.schema.nodes.image;
  if (!imageType) return;

  const imageNode = imageType.create({
    src,
    alt: "",
    title: "",
  });

  const insertPos = pos ?? state.selection.from;
  const tr = state.tr.insert(insertPos, imageNode);
  view.dispatch(tr);
}
