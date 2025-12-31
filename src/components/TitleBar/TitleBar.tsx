import { useState, useRef, useEffect, useCallback } from "react";
import { emit } from "@tauri-apps/api/event";
import { useDocumentFilePath, useDocumentIsDirty } from "@/hooks/useDocumentState";
import { useTitleBarRename } from "./useTitleBarRename";
import { getFileName } from "@/utils/pathUtils";
import "./title-bar.css";

const DEFAULT_FILENAME = "Untitled.md";

export function TitleBar() {
  const filePath = useDocumentFilePath();
  const isDirty = useDocumentIsDirty();
  const { renameFile, isRenaming } = useTitleBarRename();

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Get display filename
  const filename = filePath ? getFileName(filePath) : DEFAULT_FILENAME;
  const isUnsaved = !filePath;

  // Start editing on double-click
  const handleDoubleClick = useCallback(() => {
    if (isUnsaved) {
      // For unsaved files, open save dialog
      emit("menu:save");
      return;
    }

    // Set initial value to filename without extension
    const nameWithoutExt = filename.replace(/\.md$/i, "");
    setEditValue(nameWithoutExt);
    setIsEditing(true);
  }, [filename, isUnsaved]);

  // Focus and select input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Handle rename confirmation
  const handleConfirm = useCallback(async () => {
    const trimmed = editValue.trim();
    if (!trimmed || !filePath) {
      setIsEditing(false);
      return;
    }

    const currentName = filename.replace(/\.md$/i, "");
    if (trimmed === currentName) {
      setIsEditing(false);
      return;
    }

    const success = await renameFile(filePath, trimmed);
    if (success) {
      setIsEditing(false);
    }
    // Keep editing if rename failed
  }, [editValue, filePath, filename, renameFile]);

  // Handle key events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setIsEditing(false);
      }
    },
    [handleConfirm]
  );

  // Handle blur
  const handleBlur = useCallback(() => {
    // Cancel on blur for simplicity
    setIsEditing(false);
  }, []);

  return (
    <div className="title-bar" data-tauri-drag-region>
      <div className="title-bar-content" data-tauri-drag-region>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            className="title-bar-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            disabled={isRenaming}
          />
        ) : (
          <span
            className={`title-bar-filename ${isUnsaved ? "unsaved" : ""}`}
            onDoubleClick={handleDoubleClick}
          >
            {isDirty && <span className="dirty-indicator">•</span>}
            {filename}
          </span>
        )}
      </div>
    </div>
  );
}
