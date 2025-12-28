import { useEffect, useRef } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { callCommand } from "@milkdown/kit/utils";
import { insertImageCommand } from "@milkdown/kit/preset/commonmark";
import { editorViewCtx } from "@milkdown/kit/core";
import type { Editor } from "@milkdown/kit/core";
import type { Node, Mark } from "@milkdown/kit/prose/model";

type GetEditor = () => Editor | undefined;

export function useFormatCommands(getEditor: GetEditor) {
  const unlistenRefs = useRef<UnlistenFn[]>([]);

  useEffect(() => {
    let cancelled = false;

    const setupListeners = async () => {
      // Clean up any existing listeners first
      unlistenRefs.current.forEach((fn) => fn());
      unlistenRefs.current = [];

      if (cancelled) return;

      // Insert Image
      const unlistenImage = await listen("menu:image", async () => {
        try {
          const path = await open({
            filters: [
              {
                name: "Images",
                extensions: ["png", "jpg", "jpeg", "gif", "webp", "svg"],
              },
            ],
          });

          if (path) {
            const editor = getEditor();
            if (editor) {
              editor.action(
                callCommand(insertImageCommand.key, {
                  src: path as string,
                  alt: "",
                  title: "",
                })
              );
            }
          }
        } catch (error) {
          console.error("Failed to open image:", error);
        }
      });
      if (cancelled) { unlistenImage(); return; }
      unlistenRefs.current.push(unlistenImage);

      // Clear Format
      const unlistenClearFormat = await listen("menu:clear-format", () => {
        const editor = getEditor();
        if (editor) {
          editor.action((ctx) => {
            const view = ctx.get(editorViewCtx);
            if (!view) return;
            const { state, dispatch } = view;
            const { from, to } = state.selection;
            if (from === to) return;

            let tr = state.tr;
            state.doc.nodesBetween(from, to, (node: Node, pos: number) => {
              if (node.isText && node.marks.length > 0) {
                node.marks.forEach((mark: Mark) => {
                  tr = tr.removeMark(
                    Math.max(from, pos),
                    Math.min(to, pos + node.nodeSize),
                    mark.type
                  );
                });
              }
            });

            if (tr.docChanged) {
              dispatch(tr);
            }
          });
        }
      });
      if (cancelled) { unlistenClearFormat(); return; }
      unlistenRefs.current.push(unlistenClearFormat);
    };

    setupListeners();

    return () => {
      cancelled = true;
      const fns = unlistenRefs.current;
      unlistenRefs.current = [];
      fns.forEach((fn) => fn());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
