/**
 * Terminal Bar Component
 *
 * Bottom bar with split and close buttons for single terminal view.
 * When split (2 panes), each pane has its own close button overlay.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { Columns2, Rows2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";
import {
  useTerminalStore,
  TERMINAL_MIN_COLS,
  TERMINAL_MAX_COLS,
  TERMINAL_COLS_STEP,
} from "@/stores/terminalStore";
import "./TerminalTabs.css";

interface TerminalTabsProps {
  onSplit: () => void;
  onClose?: () => void;
  isSplit: boolean;
  canSplit: boolean;
}

export function TerminalTabs({ onSplit, onClose, isSplit, canSplit }: TerminalTabsProps) {
  const position = useSettingsStore((state) => state.terminal.position);
  const cols = useTerminalStore((state) => state.cols);
  const setCols = useTerminalStore((state) => state.setCols);

  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(cols));
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input value when cols changes externally
  useEffect(() => {
    if (!isEditing) {
      setInputValue(String(cols));
    }
  }, [cols, isEditing]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDecrement = useCallback(() => {
    setCols(cols - TERMINAL_COLS_STEP);
  }, [cols, setCols]);

  const handleIncrement = useCallback(() => {
    setCols(cols + TERMINAL_COLS_STEP);
  }, [cols, setCols]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleInputBlur = useCallback(() => {
    const value = parseInt(inputValue, 10);
    if (!isNaN(value)) {
      setCols(Math.min(TERMINAL_MAX_COLS, Math.max(TERMINAL_MIN_COLS, value)));
    }
    setIsEditing(false);
  }, [inputValue, setCols]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleInputBlur();
    } else if (e.key === "Escape") {
      setInputValue(String(cols));
      setIsEditing(false);
    }
  }, [handleInputBlur, cols]);

  // Split direction based on position: bottom=horizontal (side by side), right=vertical (top/bottom)
  const SplitIcon = position === "bottom" ? Columns2 : Rows2;
  const splitTitle = position === "bottom" ? "Split horizontal" : "Split vertical";

  return (
    <div className="terminal-tabs">
      {/* Column width control */}
      <div className="terminal-cols-control">
        <button
          className="terminal-cols-btn"
          onClick={handleDecrement}
          disabled={cols <= TERMINAL_MIN_COLS}
          title="Decrease width"
        >
          <ChevronLeft className="w-3 h-3" />
        </button>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            className="terminal-cols-input"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
          />
        ) : (
          <button
            className="terminal-cols-value"
            onClick={() => setIsEditing(true)}
            title="Click to edit"
          >
            {cols}
          </button>
        )}
        <button
          className="terminal-cols-btn"
          onClick={handleIncrement}
          disabled={cols >= TERMINAL_MAX_COLS}
          title="Increase width"
        >
          <ChevronRight className="w-3 h-3" />
        </button>
        <span className="terminal-cols-label">cols</span>
      </div>

      <div className="terminal-tabs-list" />
      <div className="terminal-tabs-actions">
        {/* Split button - hidden when already split */}
        {!isSplit && (
          <button
            className="terminal-tab-action"
            onClick={onSplit}
            disabled={!canSplit}
            title={splitTitle}
          >
            <SplitIcon className="w-4 h-4" />
          </button>
        )}
        {/* Close button - only for single terminal (split panes have their own) */}
        {!isSplit && onClose && (
          <button
            className="terminal-tab-action"
            onClick={onClose}
            title="Close terminal"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
