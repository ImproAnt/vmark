/**
 * List Mode Component
 *
 * Renders list editing buttons for indent/outdent and type conversion.
 */

import type { EditorView } from "@codemirror/view";
import { useSourceFormatStore } from "@/stores/sourceFormatStore";
import {
  indentListItem,
  outdentListItem,
  toBulletList,
  toOrderedList,
  toTaskList,
  removeList,
  type ListItemInfo,
} from "../listDetection";
import { LIST_BUTTONS, type ListAction } from "../buttonDefs";

interface ListModeProps {
  editorView: EditorView;
  listInfo: ListItemInfo;
}

export function ListMode({ editorView, listInfo }: ListModeProps) {
  const handleAction = (action: ListAction) => {
    switch (action) {
      case "outdent":
        outdentListItem(editorView, listInfo);
        break;
      case "indent":
        indentListItem(editorView, listInfo);
        break;
      case "bullet":
        toBulletList(editorView, listInfo);
        break;
      case "ordered":
        toOrderedList(editorView, listInfo);
        break;
      case "task":
        toTaskList(editorView, listInfo);
        break;
      case "remove": {
        removeList(editorView, listInfo);
        const store = useSourceFormatStore.getState();
        store.clearOriginalCursor();
        store.closePopup();
        break;
      }
    }
  };

  // Determine which type button is active
  const activeType = listInfo.type;

  return (
    <div className="source-format-row">
      {LIST_BUTTONS.map(({ id, icon, label, action }) =>
        action === "separator" ? (
          <div key={id} className="source-format-separator" />
        ) : (
          <button
            key={id}
            type="button"
            className={`source-format-btn ${
              (action === "bullet" && activeType === "bullet") ||
              (action === "ordered" && activeType === "ordered") ||
              (action === "task" && activeType === "task")
                ? "active"
                : ""
            }`}
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
