/**
 * Toolbar Focus - Smart initial focus algorithm
 *
 * Determines which button to focus when toolbar opens.
 * Runs ONCE when toolbar opens, not on toggles or selection changes.
 *
 * Priority order (Section 4.2 of spec):
 * 1. Active format marks (bold > italic > underline > strikethrough > code > link)
 * 2. Has selection → inline group
 * 3. Context-aware (inHeading, inList, inTable, etc.)
 * 4. Default to inline group
 * 5. First enabled button
 * 6. null (don't open toolbar)
 *
 * @module components/Editor/UniversalToolbar/toolbarFocus
 */
import { isSeparator, type ToolbarGroupButton } from "./toolbarGroups";
import type { ToolbarContext } from "@/plugins/toolbarActions/types";

interface ToolbarItemState {
  disabled: boolean;
  notImplemented: boolean;
  active: boolean;
}

interface ToolbarButtonState extends ToolbarItemState {
  /** Individual item states for dropdown buttons */
  itemStates?: ToolbarItemState[];
}

interface FocusOptions {
  buttons: ToolbarGroupButton[];
  states: ToolbarButtonState[];
  context: ToolbarContext;
}

/** Mark priority order for smart focus */
const MARK_PRIORITY = ["bold", "italic", "underline", "strikethrough", "code", "link"] as const;

/**
 * Find button index that contains a specific action.
 */
function findButtonIndexForAction(buttons: ToolbarGroupButton[], action: string): number {
  return buttons.findIndex((button) =>
    button.items.some((item) => !isSeparator(item) && item.action === action)
  );
}

/**
 * Check if a button at index is enabled.
 */
function isEnabled(states: ToolbarButtonState[], index: number): boolean {
  return index >= 0 && index < states.length && !states[index].disabled;
}

/**
 * Check if a specific action within a button group is active.
 * This checks the individual item state, not just the group's aggregate active state.
 */
function isActionActive(
  buttons: ToolbarGroupButton[],
  states: ToolbarButtonState[],
  buttonIndex: number,
  action: string
): boolean {
  if (buttonIndex < 0 || buttonIndex >= buttons.length) return false;

  const button = buttons[buttonIndex];
  const state = states[buttonIndex];
  if (!state.itemStates) return state.active; // Fallback if no itemStates

  // Find the item with this action and check its active state
  const itemIndex = button.items.findIndex(
    (item) => !isSeparator(item) && item.action === action
  );
  if (itemIndex < 0 || itemIndex >= state.itemStates.length) return false;

  return state.itemStates[itemIndex].active;
}

/**
 * Find first enabled button index.
 */
function findFirstEnabled(states: ToolbarButtonState[]): number {
  const index = states.findIndex((state) => !state.disabled);
  return index >= 0 ? index : -1;
}

/**
 * Get the appropriate list action based on current list type.
 */
function getListAction(context: ToolbarContext): string {
  if (context.surface === "source") {
    const listType = context.context?.inList?.type;
    if (listType === "ordered") return "orderedList";
    if (listType === "task") return "taskList";
    return "bulletList";
  }

  const listType = context.context?.inList?.listType;
  if (listType === "ordered") return "orderedList";
  if (listType === "task") return "taskList";
  return "bulletList";
}

/**
 * Get initial focus index when toolbar opens.
 *
 * Returns -1 if no enabled buttons (caller should not open toolbar).
 */
export function getInitialFocusIndex(options: FocusOptions): number {
  const { buttons, states, context } = options;
  const ctx = context.context;

  // Step 1: Check active format marks (highest priority)
  // Check specific mark active state, not just group active state
  for (const mark of MARK_PRIORITY) {
    const index = findButtonIndexForAction(buttons, mark);
    if (isEnabled(states, index) && isActionActive(buttons, states, index, mark)) {
      return index;
    }
  }

  // Step 2: Has selection → inline group (marks beat context)
  if (ctx?.hasSelection) {
    const boldIndex = findButtonIndexForAction(buttons, "bold");
    if (isEnabled(states, boldIndex)) {
      return boldIndex;
    }
  }

  // Step 3: Context-aware (only if no selection)
  if (ctx && !ctx.hasSelection) {
    // Check each context in order
    if (ctx.inHeading) {
      const index = findButtonIndexForAction(buttons, "heading:1");
      if (isEnabled(states, index)) return index;
    }

    if (ctx.inList) {
      const listAction = getListAction(context);
      const index = findButtonIndexForAction(buttons, listAction);
      if (isEnabled(states, index)) return index;
    }

    if (ctx.inTable) {
      const index = findButtonIndexForAction(buttons, "addRow");
      if (isEnabled(states, index)) return index;
    }

    if (ctx.inBlockquote) {
      const index = findButtonIndexForAction(buttons, "unnestQuote");
      if (isEnabled(states, index)) return index;
    }

    if (ctx.inCodeBlock) {
      const index = findButtonIndexForAction(buttons, "insertCodeBlock");
      if (isEnabled(states, index)) return index;
    }

    if (ctx.inLink) {
      const index = findButtonIndexForAction(buttons, "link");
      if (isEnabled(states, index)) return index;
    }
  }

  // Step 4: Default to inline group
  const boldIndex = findButtonIndexForAction(buttons, "bold");
  if (isEnabled(states, boldIndex)) {
    return boldIndex;
  }

  // Step 5: First enabled button
  const firstEnabled = findFirstEnabled(states);
  if (firstEnabled >= 0) {
    return firstEnabled;
  }

  // Step 6: No enabled buttons - return -1 (don't open toolbar)
  return -1;
}

/**
 * Check if any button is enabled.
 * Used to determine if toolbar should open at all.
 */
export function hasAnyEnabledButton(states: ToolbarButtonState[]): boolean {
  return states.some((state) => !state.disabled);
}
