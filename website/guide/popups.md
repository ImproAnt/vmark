# Inline Popups

VMark provides contextual popups for editing links, images, math, footnotes, and more. These popups work in both WYSIWYG and Source modes with consistent keyboard navigation.

## Common Keyboard Shortcuts

All popups share these keyboard behaviors:

| Action | Shortcut |
|--------|----------|
| Close/Cancel | `Escape` |
| Confirm/Save | `Enter` |
| Navigate fields | `Tab` / `Shift + Tab` |

## Link Popup

Edit hyperlinks inline without dialogs.

**Trigger:**
- **WYSIWYG:** Hover over link (300ms delay) or click
- **Source:** Click on `[text](url)` or `Mod + K` inside link

**Fields:**
- **URL** — Edit the link destination
- **Open** — Open link in browser (or jump to heading for `#bookmarks`)
- **Copy** — Copy URL to clipboard
- **Delete** — Remove link, keep text

**Shortcuts:**
- `Mod + K` — Insert new link or edit existing link at cursor

::: tip Bookmark Links
Links starting with `#` are treated as bookmarks (internal heading links). The URL field is read-only and Open jumps to the heading.
:::

## Image Popup

Edit image properties inline.

**Trigger:**
- **WYSIWYG:** Click on image
- **Source:** `Mod + Shift + I` inside image syntax

**Fields:**
- **Source** — Image URL or local path
- **Alt Text** — Accessibility description
- **Browse** — Pick image from filesystem
- **Copy** — Copy source URL
- **Toggle** — Switch between inline and block image
- **Delete** — Remove image

**Shortcuts:**
- `Mod + Shift + I` — Insert new image or edit existing

## Math Popup

Edit LaTeX math expressions with live preview.

**Trigger:**
- **WYSIWYG:** Click on inline math `$...$`

**Fields:**
- **LaTeX Input** — Edit the math expression
- **Preview** — Real-time rendered preview
- **Error Display** — Shows LaTeX errors

**Shortcuts:**
- `Mod + Enter` — Save and close
- `Escape` — Cancel and close
- `Alt + Mod + M` — Insert new inline math

::: info Source Mode
In Source mode, edit math directly in the text. The preview appears in the Mermaid/Math preview panel.
:::

## Footnote Popup

Edit footnote content inline.

**Trigger:**
- **WYSIWYG:** Hover over footnote reference `[^1]`

**Fields:**
- **Content** — Multi-line footnote text (auto-resizing)
- **Go to Definition** — Jump to footnote definition
- **Delete** — Remove footnote

**Behavior:**
- New footnotes auto-focus the content field
- Textarea expands as you type

## Wiki Link Popup

Edit wiki-style links for internal document connections.

**Trigger:**
- **WYSIWYG:** Hover over `[[target]]` (300ms delay)
- **Source:** Click on wiki link syntax

**Fields:**
- **Target** — Workspace-relative path (`.md` extension handled automatically)
- **Browse** — Pick file from workspace
- **Open** — Open linked document
- **Copy** — Copy target path
- **Delete** — Remove wiki link

## Table Context Menu

Quick table editing actions.

**Trigger:**
- **WYSIWYG:** Use toolbar or keyboard shortcuts
- **Source:** Right-click on table cell

**Actions:**
| Action | Description |
|--------|-------------|
| Insert Row Above/Below | Add row at cursor |
| Insert Column Left/Right | Add column at cursor |
| Delete Row | Remove current row |
| Delete Column | Remove current column |
| Delete Table | Remove entire table |
| Align Column Left/Center/Right | Set alignment for current column |
| Align All Left/Center/Right | Set alignment for all columns |
| Format Table | Auto-align table columns (prettify markdown) |

## Spell Check Popup

Fix spelling errors with suggestions.

**Trigger:**
- Right-click on misspelled word (red underline)

**Actions:**
- **Suggestions** — Click to replace with suggestion
- **Add to Dictionary** — Stop marking as misspelled

## Mode Comparison

| Popup | WYSIWYG | Source |
|-------|---------|--------|
| Link | Hover/Click | Click / `Mod+K` |
| Image | Click | `Mod+Shift+I` |
| Math | Click | Direct edit |
| Footnote | Hover | Direct edit |
| Wiki Link | Hover | Click |
| Table | Toolbar | Right-click menu |
| Spell Check | Right-click | Right-click |

## Popup Navigation Tips

### Focus Flow
1. Popup opens with first input focused
2. `Tab` moves forward through fields and buttons
3. `Shift + Tab` moves backward
4. Focus wraps within popup

### Quick Editing
- For simple URL changes: edit and press `Enter`
- For canceling: press `Escape` from any field
- For multi-line content (footnotes, math): use `Mod + Enter` to save

### Mouse Behavior
- Click outside popup to close (changes are discarded)
- Hover popups (link, footnote, wiki) have 300ms delay before showing
- Moving mouse back to popup keeps it open

<!-- Styles in style.css -->
