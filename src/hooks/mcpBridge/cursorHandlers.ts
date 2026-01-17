/**
 * MCP Bridge - Cursor Operation Handlers
 */

import { respond, getEditor } from "./utils";

/**
 * Handle cursor.getContext request.
 */
export async function handleCursorGetContext(
  id: string,
  args: Record<string, unknown>
): Promise<void> {
  try {
    const editor = getEditor();
    if (!editor) throw new Error("No active editor");

    const { from } = editor.state.selection;
    const doc = editor.state.doc;
    const text = doc.textContent;

    // Find current line
    let lineStart = from;
    while (lineStart > 0 && text[lineStart - 1] !== "\n") lineStart--;
    let lineEnd = from;
    while (lineEnd < text.length && text[lineEnd] !== "\n") lineEnd++;

    const currentLine = text.slice(lineStart, lineEnd);

    // Get context lines
    const linesBefore = (args.linesBefore as number) ?? 5;
    const linesAfter = (args.linesAfter as number) ?? 5;

    const lines = text.split("\n");
    let currentLineIndex = 0;
    let pos = 0;
    for (let i = 0; i < lines.length; i++) {
      if (pos + lines[i].length >= from) {
        currentLineIndex = i;
        break;
      }
      pos += lines[i].length + 1;
    }

    const beforeLines = lines
      .slice(Math.max(0, currentLineIndex - linesBefore), currentLineIndex)
      .join("\n");
    const afterLines = lines
      .slice(currentLineIndex + 1, currentLineIndex + 1 + linesAfter)
      .join("\n");

    await respond({
      id,
      success: true,
      data: {
        before: beforeLines,
        after: afterLines,
        currentLine,
        currentParagraph: currentLine,
      },
    });
  } catch (error) {
    await respond({
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Handle cursor.setPosition request.
 */
export async function handleCursorSetPosition(
  id: string,
  args: Record<string, unknown>
): Promise<void> {
  try {
    const editor = getEditor();
    if (!editor) throw new Error("No active editor");

    const position = args.position as number;
    editor.commands.setTextSelection(position);

    await respond({ id, success: true, data: null });
  } catch (error) {
    await respond({
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
