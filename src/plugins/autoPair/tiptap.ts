import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import { useSettingsStore } from "@/stores/settingsStore";
import {
  isProseMirrorComposing,
  isProseMirrorInCompositionGrace,
  markProseMirrorCompositionEnd,
  isImeKeyEvent,
} from "@/utils/imeGuard";
import {
  handleTextInput,
  createKeyHandler,
  isAllowedClosingChar,
  type AutoPairConfig,
} from "./handlers";
import {
  normalizeForPairing,
  getClosingChar,
  isClosingChar,
  type PairConfig,
} from "./pairs";
import { shouldAutoPair, getCharAt } from "./utils";

const autoPairPluginKey = new PluginKey("autoPair");

function getConfig(): AutoPairConfig {
  const settings = useSettingsStore.getState().markdown;
  return {
    enabled: settings.autoPairEnabled ?? true,
    includeCJK: settings.autoPairCJKStyle !== "off",
    includeCurlyQuotes: settings.autoPairCurlyQuotes ?? false,
    normalizeRightDoubleQuote:
      settings.autoPairCJKStyle !== "off" &&
      (settings.autoPairCurlyQuotes ?? false) &&
      (settings.autoPairRightDoubleQuote ?? false),
  };
}

/**
 * Check if IME composition is active or in grace period.
 * This prevents auto-pair from interfering with CJK input.
 */
function isComposingOrGrace(view: Parameters<typeof isProseMirrorComposing>[0]): boolean {
  return isProseMirrorComposing(view) || isProseMirrorInCompositionGrace(view);
}

export const autoPairExtension = Extension.create({
  name: "autoPair",
  addProseMirrorPlugins() {
    // Create key handler once — it reads config lazily via the getter
    const keyHandler = createKeyHandler(getConfig);

    return [
      new Plugin({
        key: autoPairPluginKey,
        props: {
          handleTextInput(view, from, to, text) {
            // Block during active IME composition (but not grace period —
            // handleTextInput only receives committed text, so the grace
            // period is unnecessarily conservative here)
            if (isProseMirrorComposing(view)) return false;
            return handleTextInput(
              view as unknown as Parameters<typeof handleTextInput>[0],
              from,
              to,
              text,
              getConfig()
            );
          },
          // Use handleDOMEvents.keydown instead of handleKeyDown to intercept
          // Tab/Backspace before Tiptap's keyboard shortcuts (list indent, etc.)
          handleDOMEvents: {
            keydown(view, event) {
              // Block during IME composition, grace period, or IME key events
              if (isComposingOrGrace(view) || isImeKeyEvent(event)) return false;
              return keyHandler(view as unknown as Parameters<typeof keyHandler>[0], event);
            },
            compositionend(view, event) {
              // Mark composition end for grace period tracking
              markProseMirrorCompositionEnd(view);

              const config = getConfig();
              if (!config.enabled) return false;

              const data = (event as CompositionEvent).data;
              if (!data || data.length !== 1) return false;

              // Schedule after ProseMirror applies the composed text
              requestAnimationFrame(() => {
                // Re-check composing state (another composition may have started)
                if (isProseMirrorComposing(view as any)) return;

                const pmView = view as any;
                const { state } = pmView;
                const { from } = state.selection;

                const pairConfig: PairConfig = {
                  includeCJK: config.includeCJK,
                  includeCurlyQuotes: config.includeCurlyQuotes,
                };

                const inputChar = config.normalizeRightDoubleQuote
                  ? normalizeForPairing(data)
                  : data;

                // Case 1: Opening bracket — insert closing bracket
                const closing = getClosingChar(inputChar, pairConfig);
                if (closing) {
                  if (!shouldAutoPair(state, from - 1, inputChar)) return;
                  // Guard: if closing bracket already present (handleTextInput handled it), skip
                  const nextChar = getCharAt(state, from);
                  if (nextChar === closing) return;

                  if (inputChar !== data) {
                    // Normalized (e.g., \u201D → \u201C): replace composed char with normalized + closing
                    const tr = state.tr.replaceWith(
                      from - 1,
                      from,
                      state.schema.text(inputChar + closing)
                    );
                    tr.setSelection(TextSelection.create(tr.doc, from));
                    pmView.dispatch(tr);
                  } else {
                    // Insert closing bracket after cursor
                    const tr = state.tr.insertText(closing, from);
                    tr.setSelection(TextSelection.create(tr.doc, from));
                    pmView.dispatch(tr);
                  }
                  return;
                }

                // Case 2: Closing bracket — skip over if duplicate
                if (isClosingChar(data) && isAllowedClosingChar(data, config)) {
                  const nextChar = getCharAt(state, from);
                  if (nextChar === data) {
                    // Composed closing bracket duplicates existing one — remove the duplicate
                    const tr = state.tr.delete(from - 1, from);
                    tr.setSelection(TextSelection.create(tr.doc, from));
                    pmView.dispatch(tr.setMeta("addToHistory", false));
                  }
                }
              });

              return false;
            },
          },
        },
      }),
    ];
  },
});
