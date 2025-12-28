import { useEffect, useRef } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { callCommand } from "@milkdown/kit/utils";
import { editorViewCtx } from "@milkdown/kit/core";
import {
  insertTableCommand,
  addRowBeforeCommand,
  addRowAfterCommand,
  addColBeforeCommand,
  addColAfterCommand,
  deleteSelectedCellsCommand,
  setAlignCommand,
} from "@milkdown/kit/preset/gfm";
import type { Editor } from "@milkdown/kit/core";

type GetEditor = () => Editor | undefined;

// Helper to ensure editor has focus before executing commands
function ensureFocusAndExecute(editor: Editor, callback: () => void) {
  editor.action((ctx) => {
    const view = ctx.get(editorViewCtx);
    if (view && !view.hasFocus()) {
      view.focus();
    }
  });
  callback();
}

export function useTableCommands(getEditor: GetEditor) {
  const unlistenRefs = useRef<UnlistenFn[]>([]);

  useEffect(() => {
    const setupListeners = async () => {
      // Clean up any existing listeners first
      unlistenRefs.current.forEach((fn) => fn());
      unlistenRefs.current = [];

      // Insert Table
      const unlistenInsertTable = await listen("menu:insert-table", () => {
        const editor = getEditor();
        if (editor) {
          ensureFocusAndExecute(editor, () => {
            editor.action(callCommand(insertTableCommand.key, { row: 3, col: 3 }));
          });
        }
      });
      unlistenRefs.current.push(unlistenInsertTable);

      // Add Row Before
      const unlistenAddRowBefore = await listen("menu:add-row-before", () => {
        const editor = getEditor();
        if (editor) {
          editor.action(callCommand(addRowBeforeCommand.key));
        }
      });
      unlistenRefs.current.push(unlistenAddRowBefore);

      // Add Row After
      const unlistenAddRowAfter = await listen("menu:add-row-after", () => {
        const editor = getEditor();
        if (editor) {
          editor.action(callCommand(addRowAfterCommand.key));
        }
      });
      unlistenRefs.current.push(unlistenAddRowAfter);

      // Add Column Before
      const unlistenAddColBefore = await listen("menu:add-col-before", () => {
        const editor = getEditor();
        if (editor) {
          editor.action(callCommand(addColBeforeCommand.key));
        }
      });
      unlistenRefs.current.push(unlistenAddColBefore);

      // Add Column After
      const unlistenAddColAfter = await listen("menu:add-col-after", () => {
        const editor = getEditor();
        if (editor) {
          editor.action(callCommand(addColAfterCommand.key));
        }
      });
      unlistenRefs.current.push(unlistenAddColAfter);

      // Delete Selected Cells
      const unlistenDeleteCells = await listen("menu:delete-selected-cells", () => {
        const editor = getEditor();
        if (editor) {
          editor.action(callCommand(deleteSelectedCellsCommand.key));
        }
      });
      unlistenRefs.current.push(unlistenDeleteCells);

      // Align Left
      const unlistenAlignLeft = await listen("menu:align-left", () => {
        const editor = getEditor();
        if (editor) {
          editor.action(callCommand(setAlignCommand.key, "left"));
        }
      });
      unlistenRefs.current.push(unlistenAlignLeft);

      // Align Center
      const unlistenAlignCenter = await listen("menu:align-center", () => {
        const editor = getEditor();
        if (editor) {
          editor.action(callCommand(setAlignCommand.key, "center"));
        }
      });
      unlistenRefs.current.push(unlistenAlignCenter);

      // Align Right
      const unlistenAlignRight = await listen("menu:align-right", () => {
        const editor = getEditor();
        if (editor) {
          editor.action(callCommand(setAlignCommand.key, "right"));
        }
      });
      unlistenRefs.current.push(unlistenAlignRight);
    };

    setupListeners();

    return () => {
      unlistenRefs.current.forEach((fn) => fn());
      unlistenRefs.current = [];
    };
  }, [getEditor]);
}
