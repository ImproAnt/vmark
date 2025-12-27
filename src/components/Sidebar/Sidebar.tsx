import { useState, useMemo } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { useEditorStore } from "@/stores/editorStore";
import "./Sidebar.css";

type ViewMode = "files" | "outline";

interface HeadingItem {
  level: number;
  text: string;
  id: string;
}

function extractHeadings(content: string): HeadingItem[] {
  const headings: HeadingItem[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
        id: `heading-${i}`,
      });
    }
  }

  return headings;
}

function FilesView() {
  const filePath = useEditorStore((state) => state.filePath);
  const fileName = filePath ? filePath.split("/").pop() : null;

  return (
    <div className="sidebar-view">
      {fileName ? (
        <div className="sidebar-file active">
          <div className="sidebar-file-name">{fileName?.replace(/\.md$/, "")}</div>
        </div>
      ) : (
        <div className="sidebar-empty">No file open</div>
      )}
    </div>
  );
}

function OutlineView() {
  const content = useEditorStore((state) => state.content);
  const headings = useMemo(() => extractHeadings(content), [content]);

  return (
    <div className="sidebar-view">
      {headings.length > 0 ? (
        <ul className="outline-list">
          {headings.map((heading) => (
            <li
              key={heading.id}
              className={`outline-item outline-level-${heading.level}`}
            >
              {heading.text}
            </li>
          ))}
        </ul>
      ) : (
        <div className="sidebar-empty">No headings</div>
      )}
    </div>
  );
}

export function Sidebar() {
  const [viewMode, setViewMode] = useState<ViewMode>("outline");

  const handleToggleView = () => {
    setViewMode((prev) => (prev === "files" ? "outline" : "files"));
  };

  const handleOpen = async () => {
    try {
      const path = await open({
        filters: [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }],
      });
      if (path) {
        const content = await readTextFile(path as string);
        useEditorStore.getState().loadContent(content, path as string);
      }
    } catch (error) {
      console.error("Failed to open file:", error);
    }
  };

  return (
    <div className="sidebar" style={{ width: "100%", height: "100%" }}>
      {/* Drag region for traffic lights area */}
      <div data-tauri-drag-region style={{ height: 32, flexShrink: 0, cursor: "grab" }} />
      <div className="sidebar-header">
        <button
          className="sidebar-btn"
          onClick={handleToggleView}
          title={viewMode === "files" ? "Show Outline" : "Show Files"}
        >
          {viewMode === "files" ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 3h12v1.5H2V3zm0 4h12v1.5H2V7zm0 4h8v1.5H2V11z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1.5 1h5v5h-5V1zm1 1v3h3V2h-3zm6.5-1h5v5h-5V1zm1 1v3h3V2h-3zm-8.5 7h5v5h-5V9zm1 1v3h3v-3h-3zm6.5-1h5v5h-5V9zm1 1v3h3v-3h-3z" />
            </svg>
          )}
        </button>
        <span className="sidebar-title">
          {viewMode === "files" ? "FILES" : "OUTLINE"}
        </span>
        <button className="sidebar-btn" onClick={handleOpen} title="Open File">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M11.5 7a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0zm-.82 4.74a6 6 0 1 1 1.06-1.06l3.04 3.04-1.06 1.06-3.04-3.04z" />
          </svg>
        </button>
      </div>

      <div className="sidebar-content">
        {viewMode === "files" ? <FilesView /> : <OutlineView />}
      </div>
    </div>
  );
}

export default Sidebar;
