/**
 * Blockquote Mode Component
 *
 * Renders blockquote editing buttons for nest/unnest/remove.
 */

import type { EditorView } from "@codemirror/view";
import { useSourceFormatStore } from "@/stores/sourceFormatStore";
import {
  nestBlockquote,
  unnestBlockquote,
  removeBlockquote,
  type BlockquoteInfo,
} from "../blockquoteDetection";
import { BLOCKQUOTE_BUTTONS, type BlockquoteAction } from "../buttonDefs";

interface BlockquoteModeProps {
  editorView: EditorView;
  blockquoteInfo: BlockquoteInfo;
}

export function BlockquoteMode({ editorView, blockquoteInfo }: BlockquoteModeProps) {
  const handleAction = (action: BlockquoteAction) => {
    switch (action) {
      case "nest":
        nestBlockquote(editorView, blockquoteInfo);
        break;
      case "unnest":
        unnestBlockquote(editorView, blockquoteInfo);
        break;
      case "remove": {
        removeBlockquote(editorView, blockquoteInfo);
        const store = useSourceFormatStore.getState();
        store.clearOriginalCursor();
        store.closePopup();
        break;
      }
    }
  };

  return (
    <div className="source-format-row">
      {BLOCKQUOTE_BUTTONS.map(({ id, icon, label, action }) =>
        action === "separator" ? (
          <div key={id} className="source-format-separator" />
        ) : (
          <button
            key={id}
            type="button"
            className="source-format-btn"
            title={label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleAction(action)}
          >
            {icon}
          </button>
        )
      )}
    </div>
  );
}
