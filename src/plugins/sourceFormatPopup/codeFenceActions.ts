/**
 * Code Fence Actions
 *
 * Functions to modify code fence language in source mode.
 */

import type { EditorView } from "@codemirror/view";
import type { CodeFenceInfo } from "./codeFenceDetection";
import { addRecentLanguage } from "./languages";

/**
 * Set or change the language of a code fence.
 * Modifies the text after ``` on the opening line.
 */
export function setCodeFenceLanguage(
  view: EditorView,
  info: CodeFenceInfo,
  language: string
): void {
  const { languageStartPos, languageEndPos } = info;

  // Replace the language portion (or insert if empty)
  view.dispatch({
    changes: {
      from: languageStartPos,
      to: languageEndPos,
      insert: language,
    },
  });

  // Track in recent languages (only if not empty)
  if (language) {
    addRecentLanguage(language);
  }
}

/**
 * Remove the language from a code fence.
 * Makes it a plain code block.
 */
export function removeCodeFenceLanguage(
  view: EditorView,
  info: CodeFenceInfo
): void {
  setCodeFenceLanguage(view, info, "");
}
