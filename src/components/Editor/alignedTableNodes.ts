import { TableCell, TableHeader } from "@tiptap/extension-table";
import { sourceLineAttr } from "@/plugins/shared/sourceLineAttr";

export const AlignedTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...sourceLineAttr,
      alignment: {
        default: null,
        parseHTML: (element) => {
          const alignment = (element as HTMLElement).style.textAlign || null;
          if (alignment === "left" || alignment === "center" || alignment === "right") return alignment;
          return null;
        },
        renderHTML: (attributes) => {
          const alignment = attributes.alignment as unknown;
          if (alignment !== "left" && alignment !== "center" && alignment !== "right") return {};
          return { style: `text-align:${alignment}` };
        },
      },
    };
  },
});

export const AlignedTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...sourceLineAttr,
      alignment: {
        default: null,
        parseHTML: (element) => {
          const alignment = (element as HTMLElement).style.textAlign || null;
          if (alignment === "left" || alignment === "center" || alignment === "right") return alignment;
          return null;
        },
        renderHTML: (attributes) => {
          const alignment = attributes.alignment as unknown;
          if (alignment !== "left" && alignment !== "center" && alignment !== "right") return {};
          return { style: `text-align:${alignment}` };
        },
      },
    };
  },
});
