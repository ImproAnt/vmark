/**
 * MCP Bridge Hook - Handles MCP requests from AI assistants.
 *
 * Listens for mcp-bridge:request events from Tauri and executes
 * the corresponding editor operations.
 */

import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import type { McpRequestEvent } from "./types";
import { respond } from "./utils";

// Document handlers
import {
  handleGetContent,
  handleSetContent,
  handleInsertAtCursor,
  handleInsertAtPosition,
  handleDocumentSearch,
  handleDocumentReplace,
} from "./documentHandlers";

// Selection handlers
import {
  handleSelectionGet,
  handleSelectionSet,
  handleSelectionReplace,
  handleSelectionDelete,
} from "./selectionHandlers";

// Cursor handlers
import { handleCursorGetContext, handleCursorSetPosition } from "./cursorHandlers";

// Format handlers
import {
  handleFormatToggle,
  handleFormatSetLink,
  handleFormatRemoveLink,
  handleFormatClear,
} from "./formatHandlers";

// Editor handlers
import { handleUndo, handleRedo, handleFocus } from "./editorHandlers";

// Block and list handlers
import {
  handleInsertHorizontalRule,
  handleListIncreaseIndent,
  handleListDecreaseIndent,
} from "./blockListHandlers";

// Table handlers
import {
  handleTableDelete,
  handleTableDeleteRow,
  handleTableDeleteColumn,
  handleTableToggleHeaderRow,
} from "./tableHandlers";

// Workspace handlers
import {
  handleWindowsList,
  handleWindowsGetFocused,
  handleWorkspaceNewDocument,
  handleWorkspaceSaveDocument,
  handleWorkspaceCloseWindow,
  handleAiNotImplemented,
} from "./workspaceHandlers";

/**
 * Route MCP request to appropriate handler.
 */
async function handleRequest(event: McpRequestEvent): Promise<void> {
  const { id, type, args } = event;

  try {
    switch (type) {
      // Document operations
      case "document.getContent":
        await handleGetContent(id);
        break;
      case "document.setContent":
        await handleSetContent(id, args);
        break;
      case "document.insertAtCursor":
        await handleInsertAtCursor(id, args);
        break;
      case "document.insertAtPosition":
        await handleInsertAtPosition(id, args);
        break;
      case "document.search":
        await handleDocumentSearch(id, args);
        break;
      case "document.replace":
        await handleDocumentReplace(id, args);
        break;

      // Selection operations
      case "selection.get":
        await handleSelectionGet(id);
        break;
      case "selection.set":
        await handleSelectionSet(id, args);
        break;
      case "selection.replace":
        await handleSelectionReplace(id, args);
        break;
      case "selection.delete":
        await handleSelectionDelete(id);
        break;

      // Cursor operations
      case "cursor.getContext":
        await handleCursorGetContext(id, args);
        break;
      case "cursor.setPosition":
        await handleCursorSetPosition(id, args);
        break;

      // Format operations
      case "format.toggle":
        await handleFormatToggle(id, args);
        break;
      case "format.setLink":
        await handleFormatSetLink(id, args);
        break;
      case "format.removeLink":
        await handleFormatRemoveLink(id);
        break;
      case "format.clear":
        await handleFormatClear(id);
        break;

      // Editor operations
      case "editor.undo":
        await handleUndo(id);
        break;
      case "editor.redo":
        await handleRedo(id);
        break;
      case "editor.focus":
        await handleFocus(id);
        break;

      // Block operations
      case "block.insertHorizontalRule":
        await handleInsertHorizontalRule(id);
        break;

      // List operations
      case "list.increaseIndent":
        await handleListIncreaseIndent(id);
        break;
      case "list.decreaseIndent":
        await handleListDecreaseIndent(id);
        break;

      // Table operations
      case "table.delete":
        await handleTableDelete(id);
        break;
      case "table.deleteRow":
        await handleTableDeleteRow(id);
        break;
      case "table.deleteColumn":
        await handleTableDeleteColumn(id);
        break;
      case "table.toggleHeaderRow":
        await handleTableToggleHeaderRow(id);
        break;

      // Window operations
      case "windows.list":
        await handleWindowsList(id);
        break;
      case "windows.getFocused":
        await handleWindowsGetFocused(id);
        break;

      // Workspace operations
      case "workspace.newDocument":
        await handleWorkspaceNewDocument(id);
        break;
      case "workspace.saveDocument":
        await handleWorkspaceSaveDocument(id);
        break;
      case "workspace.closeWindow":
        await handleWorkspaceCloseWindow(id, args);
        break;

      // AI operations (not implemented - require external AI service)
      case "ai.improveWriting":
      case "ai.fixGrammar":
      case "ai.summarize":
      case "ai.expand":
        await handleAiNotImplemented(id, type);
        break;

      default:
        await respond({
          id,
          success: false,
          error: `Unknown request type: ${type}`,
        });
    }
  } catch (error) {
    await respond({
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Hook to enable MCP bridge request handling.
 * Should be used once in the main app component.
 */
export function useMcpBridge(): void {
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    listen<McpRequestEvent>("mcp-bridge:request", (event) => {
      handleRequest(event.payload);
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      unlisten?.();
    };
  }, []);
}
