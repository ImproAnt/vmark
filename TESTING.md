# VMark Testing Guide

**Date**: 2025-12-30
**Version**: Based on current main branch

This document outlines all features that need testing, organized by category. Tests are marked as:
- `[AUTO]` - Can be automated with Tauri MCP
- `[MANUAL]` - Requires manual verification
- `[VISUAL]` - Requires visual inspection

---

## 1. File Management

### 1.1 New Document
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Create new window (Cmd+N) | [AUTO] | Press Cmd+N | New window opens with cascaded position |
| New window has empty content | [AUTO] | Create new window | Content is empty, title shows "Untitled" |
| Multiple windows cascade | [MANUAL] | Create 3+ windows | Windows offset diagonally |

### 1.2 Open File
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Open dialog appears (Cmd+O) | [AUTO] | Press Cmd+O | File dialog opens |
| Open .md file | [MANUAL] | Select markdown file | Content loads, title updates |
| Open with unsaved changes | [MANUAL] | Modify doc, press Cmd+O | Warning dialog appears |
| Filter shows markdown files | [VISUAL] | Open dialog | Only .md, .markdown, .txt visible |

### 1.3 Save File
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Save new document (Cmd+S) | [AUTO] | Create new doc, type, Cmd+S | Save dialog appears |
| Save existing document | [AUTO] | Open file, modify, Cmd+S | File saved, dirty indicator clears |
| Save As (Cmd+Shift+S) | [MANUAL] | Open file, Cmd+Shift+S | Save dialog for new path |
| Dirty indicator shows | [AUTO] | Modify document | Title shows "• " prefix |
| Dirty indicator clears on save | [AUTO] | Save document | "• " prefix removed |

### 1.4 Close Window
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Close clean window (Cmd+W) | [AUTO] | Open doc (unchanged), Cmd+W | Window closes immediately |
| Close dirty window | [AUTO] | Modify doc, Cmd+W | Save/Don't Save/Cancel dialog |
| Close via traffic light | [MANUAL] | Click red close button | Same behavior as Cmd+W |
| Cancel close | [MANUAL] | Dirty doc, Cmd+W, click Cancel | Window stays open |
| Don't Save on close | [MANUAL] | Dirty doc, Cmd+W, Don't Save | Window closes, no save |

### 1.5 Quit Application
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Quit with no dirty windows | [AUTO] | Cmd+Q with saved docs | App quits |
| Quit with dirty window | [MANUAL] | Dirty doc, Cmd+Q | Save prompts for each dirty window |
| Force quit | [MANUAL] | Multiple dirty windows, cancel all | App stays open |

### 1.6 Recent Files
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Recent files populated | [MANUAL] | Open several files | File > Open Recent shows list |
| Open from recent | [MANUAL] | Click recent file | File opens |
| Clear recent files | [MANUAL] | File > Clear Recent | List clears |
| Recent file not found | [MANUAL] | Delete file, open from recent | Error dialog, offer to remove |

---

## 2. Editing Features

### 2.1 Text Formatting
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Bold (Cmd+B) | [AUTO] | Select text, Cmd+B | Text becomes **bold** |
| Italic (Cmd+I) | [AUTO] | Select text, Cmd+I | Text becomes *italic* |
| Inline Code (Cmd+`) | [AUTO] | Select text, Cmd+` | Text becomes `code` |
| Strikethrough | [AUTO] | Format menu | Text becomes ~~strikethrough~~ |
| Clear formatting | [AUTO] | Select formatted text, clear | All marks removed |

### 2.2 Headings
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Heading 1 (Cmd+1) | [AUTO] | Place cursor, Cmd+1 | Line becomes # Heading |
| Heading 2-6 (Cmd+2-6) | [AUTO] | Place cursor, Cmd+N | Correct heading level |
| Cycle heading levels | [AUTO] | Multiple Cmd+1 on same line | Cycles through levels |

### 2.3 Lists
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Bullet list | [AUTO] | Format > Bullet List | Line becomes - item |
| Numbered list | [AUTO] | Format > Numbered List | Line becomes 1. item |
| Task list | [AUTO] | Format > Task List | Line becomes - [ ] item |
| Indent list (Tab) | [MANUAL] | In list, press Tab | Item indents |
| Outdent list (Shift+Tab) | [MANUAL] | In nested list, Shift+Tab | Item outdents |

### 2.4 Block Elements
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Blockquote | [AUTO] | Format > Blockquote | Line becomes > quote |
| Code block | [AUTO] | Format > Code Block | Creates ``` block |
| Horizontal rule | [AUTO] | Insert > Horizontal Rule | --- inserted |

### 2.5 Tables
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Insert table | [AUTO] | Insert > Table | 3x3 table inserted |
| Add row above | [MANUAL] | In table, menu | Row added above cursor |
| Add row below | [MANUAL] | In table, menu | Row added below cursor |
| Add column left | [MANUAL] | In table, menu | Column added left |
| Add column right | [MANUAL] | In table, menu | Column added right |
| Delete cell | [MANUAL] | In table, menu | Cell deleted |
| Align cell left/center/right | [MANUAL] | In table, menu | Cell alignment changes |

### 2.6 Selection Commands
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Select Word (Cmd+D) | [AUTO] | Cursor in word, Cmd+D | Word selected |
| Select Line (Cmd+L) | [AUTO] | Cursor on line, Cmd+L | Entire line selected |
| Select Block | [AUTO] | Cursor in paragraph | Paragraph selected |
| Expand Selection | [AUTO] | Multiple presses | Selection expands to parent |

---

## 3. Writing Experience

### 3.1 Focus Mode
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Toggle focus mode (F8) | [AUTO] | Press F8 | Focus mode toggles |
| Focus mode dims content | [VISUAL] | Enable focus mode | Only current paragraph bright |
| Focus mode follows cursor | [VISUAL] | Move to different paragraph | New paragraph highlighted |

### 3.2 Typewriter Mode
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Toggle typewriter mode (F9) | [AUTO] | Press F9 | Typewriter mode toggles |
| Cursor stays centered | [VISUAL] | Type in long document | Cursor remains vertically centered |

### 3.3 Source Mode
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Toggle source mode (Cmd+/) | [AUTO] | Press Cmd+/ | Switches to source view |
| Cursor position preserved | [AUTO] | Switch modes | Cursor at similar position |
| Content synced | [AUTO] | Edit in source, switch back | Changes reflected |

### 3.4 Syntax Reveal
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Bold markers shown | [VISUAL] | Cursor inside **bold** | ** markers visible |
| Italic markers shown | [VISUAL] | Cursor inside *italic* | * markers visible |
| Link brackets shown | [VISUAL] | Cursor inside [link]() | Full syntax visible |

### 3.5 Word Wrap
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Toggle word wrap | [AUTO] | View > Word Wrap | Lines wrap/unwrap |

---

## 4. Special Content

### 4.1 Math/LaTeX
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Inline math renders | [VISUAL] | Type $E=mc^2$ | Renders as formula |
| Block math renders | [VISUAL] | Type $$\int_0^1 x dx$$ | Renders as centered formula |
| LaTeX code block | [VISUAL] | Create ```latex block | Renders math |
| Invalid LaTeX shows error | [VISUAL] | Type $\invalid$ | Error display, not crash |

### 4.2 Mermaid Diagrams
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Flowchart renders | [VISUAL] | ```mermaid flowchart | Diagram shows |
| Sequence diagram | [VISUAL] | ```mermaid sequenceDiagram | Diagram shows |
| Invalid mermaid | [VISUAL] | Invalid syntax | Error message, no crash |
| XSS blocked (SECURITY) | [AUTO] | Malicious diagram content | No script execution |

### 4.3 Alert Blocks
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| NOTE alert | [VISUAL] | Type > [!NOTE] | Blue info box |
| TIP alert | [VISUAL] | Type > [!TIP] | Green tip box |
| WARNING alert | [VISUAL] | Type > [!WARNING] | Yellow warning box |
| CAUTION alert | [VISUAL] | Type > [!CAUTION] | Red caution box |

### 4.4 Collapsible Blocks
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Create details block | [AUTO] | Insert > Collapsible | Details block created |
| Toggle collapse | [MANUAL] | Click summary | Content shows/hides |

---

## 5. Images

### 5.1 Image Insertion
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Insert image (menu) | [MANUAL] | Insert > Image | File dialog opens |
| Image copied to assets | [MANUAL] | Insert image | File in ./assets/images/ |
| Relative path in markdown | [AUTO] | Check source | Path is ./assets/images/... |

### 5.2 Image Paste
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Paste image from clipboard | [MANUAL] | Copy image, Cmd+V | Image inserted |
| Unsaved doc warning | [MANUAL] | Paste in unsaved doc | Warning to save first |

### 5.3 Image Drag & Drop
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Drag image file | [MANUAL] | Drag .png/.jpg onto editor | Image inserted |
| Multiple images | [MANUAL] | Drag multiple files | All inserted |

### 5.4 Image Security
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Path traversal blocked | [AUTO] | Try ../../../etc/passwd | Path rejected |
| Absolute path blocked | [AUTO] | Try /etc/passwd | Path rejected |

---

## 6. Search & Replace

### 6.1 Find
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Open find bar (Cmd+F) | [AUTO] | Press Cmd+F | Find bar appears |
| Find text | [AUTO] | Type search term | Matches highlighted |
| Find next (Cmd+G) | [AUTO] | Press Cmd+G | Jump to next match |
| Find previous (Cmd+Shift+G) | [AUTO] | Press Cmd+Shift+G | Jump to previous |
| Case sensitive | [MANUAL] | Toggle case option | Results change |
| Whole word | [MANUAL] | Toggle whole word | Results change |

### 6.2 Replace
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Replace current | [MANUAL] | Enter replacement, click Replace | Current match replaced |
| Replace all | [MANUAL] | Click Replace All | All matches replaced |
| Regex search | [MANUAL] | Enable regex, search pattern | Pattern matches |

---

## 7. CJK Formatting

### 7.1 Text Normalization
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Ellipsis normalization | [AUTO] | Type ..., format | Converts to … |
| Fullwidth chars normalized | [AUTO] | Type ＡＢＣ, format | Converts to ABC |
| CJK-English spacing | [AUTO] | Type 中文English中文, format | Space added between |
| Consecutive punctuation | [AUTO] | Type ！！！, format | Reduced to ！ |

---

## 8. Export

### 8.1 Export Formats
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Export HTML | [MANUAL] | File > Export > HTML | HTML file saved |
| Save PDF | [MANUAL] | File > Export > PDF | PDF file saved |
| Copy as HTML | [MANUAL] | Edit > Copy as HTML | HTML in clipboard |

---

## 9. Settings

### 9.1 Appearance
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Theme changes | [VISUAL] | Change theme in settings | Editor theme updates |
| Font changes | [VISUAL] | Change font | Editor font updates |
| Font size changes | [VISUAL] | Change size | Text size updates |
| Line height changes | [VISUAL] | Change line height | Spacing updates |

### 9.2 General Settings
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Auto-save toggle | [MANUAL] | Toggle auto-save | Auto-save behavior changes |
| Auto-save interval | [MANUAL] | Change interval | Save frequency changes |
| History toggle | [MANUAL] | Toggle history | Snapshots created/not |

---

## 10. UI Components

### 10.1 Sidebar
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Toggle sidebar (Cmd+Shift+B) | [AUTO] | Press Cmd+Shift+B | Sidebar shows/hides |
| Outline view | [VISUAL] | Click Outline tab | Headings displayed |
| Click outline heading | [MANUAL] | Click heading in outline | Scrolls to heading |
| History view | [VISUAL] | Click History tab | Snapshots displayed |
| Revert to snapshot | [MANUAL] | Click revert on snapshot | Content restored |

### 10.2 Status Bar
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Word count updates | [AUTO] | Type text | Count increases |
| Character count updates | [AUTO] | Type text | Count increases |
| Mode indicator | [VISUAL] | Toggle source mode | Indicator changes |

---

## 11. Multi-Window Support

### 11.1 Window Independence
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Each window has own content | [MANUAL] | Open 2 files in 2 windows | Different content |
| Each window tracks dirty state | [MANUAL] | Modify one window | Only that window shows dirty |
| Close one doesn't affect other | [MANUAL] | Close one window | Other remains open |

### 11.2 Menu Events
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Menu affects focused window | [MANUAL] | Focus window, use menu | Only focused window changes |
| Global events reach all | [MANUAL] | Cmd+Q | All windows prompted |

---

## 12. Security (Critical)

### 12.1 XSS Prevention
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Mermaid strict mode | [AUTO] | Check securityLevel config | Set to "strict" |
| HTML sanitized in preview | [AUTO] | Inject `<script>` in content | Script not executed |
| SVG sanitized | [AUTO] | Inject event handlers | Handlers removed |
| LaTeX error escaped | [AUTO] | Invalid LaTeX with `<script>` | Displayed escaped |

### 12.2 Path Security
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Image path traversal | [AUTO] | Try `../../../etc/passwd` | Rejected |
| Absolute paths blocked | [AUTO] | Try `/etc/passwd` | Rejected |

---

## 13. Re-entry Guards (Stability)

### 13.1 Dialog Guards
| Test | Type | Steps | Expected |
|------|------|-------|----------|
| Double Cmd+W | [AUTO] | Rapid Cmd+W twice | Only one dialog |
| Double Cmd+S on new file | [AUTO] | Rapid Cmd+S twice | Only one dialog |
| Double Cmd+O | [AUTO] | Rapid Cmd+O twice | Only one dialog |
| Multiple export clicks | [MANUAL] | Click export rapidly | Only one operation |

---

## Automated Test Script Template

The following test scenarios can be automated using Tauri MCP:

```typescript
// Test: Create new window
await tauri_webview_keyboard({ keys: ["Meta", "n"] });
await sleep(500);
// Verify new window exists

// Test: Type and verify dirty state
await tauri_webview_keyboard({ text: "Hello World" });
await sleep(200);
// Check title contains "• "

// Test: Save shortcut
await tauri_webview_keyboard({ keys: ["Meta", "s"] });
await sleep(500);
// Verify save dialog appeared

// Test: Toggle source mode
await tauri_webview_keyboard({ keys: ["Meta", "/"] });
await sleep(300);
// Verify CodeMirror visible

// Test: Focus mode toggle
await tauri_webview_keyboard({ keys: ["F8"] });
await sleep(300);
// Verify focus-mode class applied
```

---

## Manual Testing Checklist

Before each release, manually verify:

- [ ] All themes render correctly
- [ ] All fonts apply properly
- [ ] PDF export produces readable output
- [ ] Drag & drop images work
- [ ] Clipboard image paste works
- [ ] Table editing functions work
- [ ] Recent files menu updates
- [ ] Settings persist after restart
- [ ] Multi-window state isolation
- [ ] macOS menu bar integration
- [ ] Window cascade positioning
