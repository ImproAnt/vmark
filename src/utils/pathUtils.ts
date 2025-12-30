/**
 * Cross-platform Path Utilities
 *
 * Handles both Windows (backslash) and POSIX (forward slash) paths.
 */

/**
 * Extract the filename from a path (works for both Windows and POSIX).
 */
export function getFileName(filePath: string): string {
  // Handle both forward and back slashes
  const lastSlash = Math.max(filePath.lastIndexOf("/"), filePath.lastIndexOf("\\"));
  return lastSlash >= 0 ? filePath.slice(lastSlash + 1) : filePath;
}

/**
 * Extract the filename without extension.
 */
export function getFileNameWithoutExtension(filePath: string): string {
  const name = getFileName(filePath);
  const lastDot = name.lastIndexOf(".");
  return lastDot > 0 ? name.slice(0, lastDot) : name;
}

/**
 * Get the directory part of a path (works for both Windows and POSIX).
 */
export function getDirectory(filePath: string): string {
  const lastSlash = Math.max(filePath.lastIndexOf("/"), filePath.lastIndexOf("\\"));
  return lastSlash >= 0 ? filePath.slice(0, lastSlash) : "";
}
