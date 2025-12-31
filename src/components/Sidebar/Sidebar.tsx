import { useState, useMemo, useEffect, useRef } from "react";
import { ListTree, TableOfContents, History, RotateCcw, ChevronRight, ChevronDown } from "lucide-react";
import { emit } from "@tauri-apps/api/event";
import { useUIStore, type SidebarViewMode } from "@/stores/uiStore";
import { useSettingsStore } from "@/stores/settingsStore";
import {
  useDocumentContent,
  useDocumentFilePath,
  useDocumentActions,
} from "@/hooks/useDocumentState";
import { ask } from "@tauri-apps/plugin-dialog";
import {
  getSnapshots,
  revertToSnapshot,
  type Snapshot,
} from "@/utils/historyUtils";
import { formatSnapshotTime, groupByDay } from "@/utils/dateUtils";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { FileExplorer } from "./FileExplorer";
import "./Sidebar.css";

// Constants
const TRAFFIC_LIGHTS_SPACER_PX = 38;

// View mode configuration - single source of truth
const VIEW_CONFIG: Record<SidebarViewMode, {
  icon: typeof ListTree;
  title: string;
  next: SidebarViewMode;
}> = {
  files: { icon: ListTree, title: "FILES", next: "outline" },
  outline: { icon: TableOfContents, title: "OUTLINE", next: "history" },
  history: { icon: History, title: "HISTORY", next: "files" },
};

interface HeadingItem {
  level: number;
  text: string;
  line: number; // 0-based line number in content
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
        line: i,
      });
    }
  }

  return headings;
}

function FilesView() {
  const filePath = useDocumentFilePath();
  return <FileExplorer currentFilePath={filePath} />;
}

// Build tree structure from flat headings list
interface HeadingNode extends HeadingItem {
  children: HeadingNode[];
  index: number; // Original index in flat list
}

function buildHeadingTree(headings: HeadingItem[]): HeadingNode[] {
  const root: HeadingNode[] = [];
  const stack: HeadingNode[] = [];

  headings.forEach((heading, index) => {
    const node: HeadingNode = { ...heading, children: [], index };

    // Pop stack until we find a parent with smaller level
    while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  });

  return root;
}

function OutlineItem({
  node,
  activeIndex,
  collapsedSet,
  onToggle,
  onClick,
}: {
  node: HeadingNode;
  activeIndex: number;
  collapsedSet: Set<number>;
  onToggle: (index: number) => void;
  onClick: (headingIndex: number) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isCollapsed = collapsedSet.has(node.index);
  const isActive = node.index === activeIndex;

  return (
    <li className="outline-tree-item">
      <div
        className={`outline-item outline-level-${node.level} ${isActive ? "active" : ""}`}
        onClick={() => onClick(node.index)}
      >
        {hasChildren ? (
          <button
            className="outline-toggle"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.index);
            }}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>
        ) : (
          <span className="outline-toggle-spacer" />
        )}
        <span className="outline-text">{node.text}</span>
      </div>
      {hasChildren && !isCollapsed && (
        <ul className="outline-children">
          {node.children.map((child) => (
            <OutlineItem
              key={child.index}
              node={child}
              activeIndex={activeIndex}
              collapsedSet={collapsedSet}
              onToggle={onToggle}
              onClick={onClick}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function OutlineView() {
  const content = useDocumentContent();
  const activeHeadingIndex = useUIStore((state) => state.activeHeadingLine);
  const headings = useMemo(() => extractHeadings(content), [content]);
  const tree = useMemo(() => buildHeadingTree(headings), [headings]);
  // activeHeadingLine now stores the heading index directly
  const activeIndex = activeHeadingIndex ?? -1;

  // Track collapsed state locally
  const [collapsedSet, setCollapsedSet] = useState<Set<number>>(new Set());

  // Reset collapsed state when headings change (indices become invalid)
  useEffect(() => {
    setCollapsedSet(new Set());
  }, [headings]);

  const handleToggle = (index: number) => {
    setCollapsedSet((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleClick = (headingIndex: number) => {
    // Emit event to scroll editor to this heading
    emit("outline:scroll-to-heading", { headingIndex });
    // Update active heading immediately for responsive UI
    useUIStore.getState().setActiveHeadingLine(headingIndex);
  };

  return (
    <div className="sidebar-view outline-view">
      {headings.length > 0 ? (
        <ul className="outline-tree">
          {tree.map((node) => (
            <OutlineItem
              key={node.index}
              node={node}
              activeIndex={activeIndex}
              collapsedSet={collapsedSet}
              onToggle={handleToggle}
              onClick={handleClick}
            />
          ))}
        </ul>
      ) : (
        <div className="sidebar-empty">No headings</div>
      )}
    </div>
  );
}


function HistoryView() {
  const filePath = useDocumentFilePath();
  const { getContent, loadContent } = useDocumentActions();
  const historyEnabled = useSettingsStore((state) => state.general.historyEnabled);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);
  const isRevertingRef = useRef(false);

  // Fetch snapshots when filePath changes (with cancellation)
  useEffect(() => {
    if (!filePath || !historyEnabled) {
      setSnapshots([]);
      return;
    }

    // Increment request ID to cancel stale requests
    const currentRequestId = ++requestIdRef.current;

    const fetchSnapshots = async () => {
      setLoading(true);
      try {
        const snaps = await getSnapshots(filePath);
        // Only update if this is still the current request
        if (currentRequestId === requestIdRef.current) {
          setSnapshots(snaps);
        }
      } catch (error) {
        if (currentRequestId === requestIdRef.current) {
          console.error("Failed to fetch snapshots:", error);
          setSnapshots([]);
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    };

    fetchSnapshots();
  }, [filePath, historyEnabled]);

  const handleRevert = async (snapshot: Snapshot) => {
    if (!filePath) return;
    // Prevent re-entry (duplicate dialogs from rapid clicks)
    if (isRevertingRef.current) return;
    isRevertingRef.current = true;

    try {
      const confirmed = await ask(
        `Revert to version from ${formatSnapshotTime(snapshot.timestamp)}?\n\nYour current changes will be saved as a new history entry first.`,
        {
          title: "Revert to Earlier Version",
          kind: "warning",
        }
      );

      if (!confirmed) return;

      // Get fresh content to capture any edits made while dialog was open
      const currentContent = getContent();
      const { general } = useSettingsStore.getState();
      const restoredContent = await revertToSnapshot(
        filePath,
        snapshot.id,
        currentContent,
        {
          maxSnapshots: general.historyMaxSnapshots,
          maxAgeDays: general.historyMaxAgeDays,
        }
      );

      if (restoredContent !== null) {
        // Write to file
        await writeTextFile(filePath, restoredContent);
        // Update editor
        loadContent(restoredContent, filePath);
        // Refresh snapshots
        const snaps = await getSnapshots(filePath);
        setSnapshots(snaps);
      }
    } catch (error) {
      console.error("Failed to revert:", error);
    } finally {
      isRevertingRef.current = false;
    }
  };

  if (!filePath) {
    return (
      <div className="sidebar-view">
        <div className="sidebar-empty">Save document to enable history</div>
      </div>
    );
  }

  if (!historyEnabled) {
    return (
      <div className="sidebar-view">
        <div className="sidebar-empty">History is disabled in settings</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="sidebar-view">
        <div className="sidebar-empty">Loading...</div>
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="sidebar-view">
        <div className="sidebar-empty">No history yet</div>
      </div>
    );
  }

  const grouped = groupByDay(snapshots, (s) => s.timestamp);

  return (
    <div className="sidebar-view history-view">
      {Array.from(grouped.entries()).map(([day, daySnapshots]) => (
        <div key={day} className="history-group">
          <div className="history-day">{day}</div>
          {daySnapshots.map((snapshot) => (
            <div key={snapshot.id} className="history-item">
              <div className="history-item-info">
                <span className="history-time">
                  {new Date(snapshot.timestamp).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="history-type">({snapshot.type})</span>
              </div>
              <button
                className="history-revert-btn"
                onClick={() => handleRevert(snapshot)}
                title="Revert to this version"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function Sidebar() {
  const viewMode = useUIStore((state) => state.sidebarViewMode);
  const config = VIEW_CONFIG[viewMode];
  const Icon = config.icon;
  const nextTitle = VIEW_CONFIG[config.next].title;

  const handleToggleView = () => {
    const { sidebarViewMode, setSidebarViewMode } = useUIStore.getState();
    setSidebarViewMode(VIEW_CONFIG[sidebarViewMode].next);
  };

  return (
    <div className="sidebar" style={{ width: "100%", height: "100%" }}>
      {/* Spacer for traffic lights area */}
      <div style={{ height: TRAFFIC_LIGHTS_SPACER_PX, flexShrink: 0 }} />
      <div className="sidebar-header">
        <button
          className="sidebar-btn"
          onClick={handleToggleView}
          title={`Show ${nextTitle.charAt(0) + nextTitle.slice(1).toLowerCase()}`}
        >
          <Icon size={16} />
        </button>
        <span className="sidebar-title">{config.title}</span>
      </div>

      <div className="sidebar-content">
        {viewMode === "files" && <FilesView />}
        {viewMode === "outline" && <OutlineView />}
        {viewMode === "history" && <HistoryView />}
      </div>
    </div>
  );
}

export default Sidebar;
