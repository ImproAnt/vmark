import { useEffect, useRef } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { callCommand } from "@milkdown/kit/utils";
import {
  wrapInHeadingCommand,
  turnIntoTextCommand,
  wrapInBlockquoteCommand,
  createCodeBlockCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
  sinkListItemCommand,
  liftListItemCommand,
  insertHrCommand,
} from "@milkdown/kit/preset/commonmark";
import type { Editor } from "@milkdown/kit/core";

type GetEditor = () => Editor | undefined;

export function useParagraphCommands(getEditor: GetEditor) {
  const unlistenRefs = useRef<UnlistenFn[]>([]);

  useEffect(() => {
    const setupListeners = async () => {
      // Clean up any existing listeners first
      unlistenRefs.current.forEach((fn) => fn());
      unlistenRefs.current = [];

      // Heading commands (Cmd+1 through Cmd+6)
      for (let level = 1; level <= 6; level++) {
        const unlisten = await listen(`menu:heading-${level}`, () => {
          const editor = getEditor();
          if (editor) {
            editor.action(callCommand(wrapInHeadingCommand.key, level));
          }
        });
        unlistenRefs.current.push(unlisten);
      }

      // Paragraph (turn into text)
      const unlistenParagraph = await listen("menu:paragraph", () => {
        const editor = getEditor();
        if (editor) {
          editor.action(callCommand(turnIntoTextCommand.key));
        }
      });
      unlistenRefs.current.push(unlistenParagraph);

      // Increase heading level
      const unlistenIncreaseHeading = await listen("menu:increase-heading", () => {
        const editor = getEditor();
        if (editor) {
          editor.action(callCommand(wrapInHeadingCommand.key, 1));
        }
      });
      unlistenRefs.current.push(unlistenIncreaseHeading);

      // Decrease heading level
      const unlistenDecreaseHeading = await listen("menu:decrease-heading", () => {
        const editor = getEditor();
        if (editor) {
          editor.action(callCommand(wrapInHeadingCommand.key, 2));
        }
      });
      unlistenRefs.current.push(unlistenDecreaseHeading);

      // Quote
      const unlistenQuote = await listen("menu:quote", () => {
        const editor = getEditor();
        if (editor) {
          editor.action(callCommand(wrapInBlockquoteCommand.key));
        }
      });
      unlistenRefs.current.push(unlistenQuote);

      // Code Fences
      const unlistenCodeFences = await listen("menu:code-fences", () => {
        const editor = getEditor();
        if (editor) {
          editor.action(callCommand(createCodeBlockCommand.key));
        }
      });
      unlistenRefs.current.push(unlistenCodeFences);

      // Ordered List
      const unlistenOrderedList = await listen("menu:ordered-list", () => {
        const editor = getEditor();
        if (editor) {
          editor.action(callCommand(wrapInOrderedListCommand.key));
        }
      });
      unlistenRefs.current.push(unlistenOrderedList);

      // Unordered List
      const unlistenUnorderedList = await listen("menu:unordered-list", () => {
        const editor = getEditor();
        if (editor) {
          editor.action(callCommand(wrapInBulletListCommand.key));
        }
      });
      unlistenRefs.current.push(unlistenUnorderedList);

      // Task List
      const unlistenTaskList = await listen("menu:task-list", () => {
        const editor = getEditor();
        if (editor) {
          editor.action(callCommand(wrapInBulletListCommand.key));
        }
      });
      unlistenRefs.current.push(unlistenTaskList);

      // Indent (sink list item)
      const unlistenIndent = await listen("menu:indent", () => {
        const editor = getEditor();
        if (editor) {
          editor.action(callCommand(sinkListItemCommand.key));
        }
      });
      unlistenRefs.current.push(unlistenIndent);

      // Outdent (lift list item)
      const unlistenOutdent = await listen("menu:outdent", () => {
        const editor = getEditor();
        if (editor) {
          editor.action(callCommand(liftListItemCommand.key));
        }
      });
      unlistenRefs.current.push(unlistenOutdent);

      // Horizontal Line
      const unlistenHorizontalLine = await listen("menu:horizontal-line", () => {
        const editor = getEditor();
        if (editor) {
          editor.action(callCommand(insertHrCommand.key));
        }
      });
      unlistenRefs.current.push(unlistenHorizontalLine);
    };

    setupListeners();

    return () => {
      unlistenRefs.current.forEach((fn) => fn());
      unlistenRefs.current = [];
    };
  }, [getEditor]);
}
