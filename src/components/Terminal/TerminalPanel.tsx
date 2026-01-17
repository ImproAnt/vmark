import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  useTerminalStore,
  type TerminalSession,
  type SplitDirection,
} from "@/stores/terminalStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTerminalResize } from "@/hooks/useTerminalResize";
import { TerminalView } from "./TerminalView";
import { TerminalTabs } from "./TerminalTabs";
import "./TerminalPanel.css";

/** Represents a mounted terminal - either new or restoring */
interface MountedTerminal {
  key: string;
  /** Session to restore, if any */
  sessionToRestore?: TerminalSession;
}

export function TerminalPanel() {
  const visible = useTerminalStore((state) => state.visible);
  const height = useTerminalStore((state) => state.height);
  const width = useTerminalStore((state) => state.width);
  const sessions = useTerminalStore((state) => state.sessions);
  const activeSessionId = useTerminalStore((state) => state.activeSessionId);
  const removeSession = useTerminalStore((state) => state.removeSession);
  const getSessionsToRestore = useTerminalStore((state) => state.getSessionsToRestore);
  const splitSession = useTerminalStore((state) => state.splitSession);
  const position = useSettingsStore((state) => state.terminal.position);
  const handleResizeStart = useTerminalResize();

  // Local state to track mounted terminals
  const [mountedTerminals, setMountedTerminals] = useState<MountedTerminal[]>([]);

  // Create a new terminal session by mounting a new TerminalView
  const handleNewSession = useCallback(() => {
    const key = `term-${Date.now()}`;
    setMountedTerminals((prev) => [...prev, { key }]);
  }, []);

  // Split the active session
  const handleSplitSession = useCallback(
    (sessionId: string, direction: SplitDirection) => {
      // Create placeholder ID - will be updated when PTY spawns
      const tempId = `split-${Date.now()}`;
      splitSession(sessionId, tempId, direction);
      // Mount a new terminal view for the split
      setMountedTerminals((prev) => [...prev, { key: `split-${tempId}` }]);
    },
    [splitSession]
  );

  // Close a session
  const handleCloseSession = useCallback(
    async (sessionId: string) => {
      // Kill PTY if still running
      try {
        await invoke("pty_kill", { sessionId });
      } catch {
        // Session may already be dead
      }
      removeSession(sessionId);
    },
    [removeSession]
  );

  // Restore sessions on initial mount when panel becomes visible
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (visible && mountedTerminals.length === 0 && !hasInitialized.current) {
      hasInitialized.current = true;

      // Check for sessions that need restoration
      const sessionsToRestore = getSessionsToRestore();

      if (sessionsToRestore.length > 0) {
        // Mount terminals for each session that needs restoration
        const restoredTerminals: MountedTerminal[] = sessionsToRestore.map((session, index) => ({
          key: `restore-${session.id}-${index}`,
          sessionToRestore: session,
        }));
        setMountedTerminals(restoredTerminals);
      } else {
        // No sessions to restore, create a new one
        handleNewSession();
      }
    }
  }, [visible, mountedTerminals.length, handleNewSession, getSessionsToRestore]);

  // Clean up mounted terminals that no longer have sessions
  useEffect(() => {
    // Count active sessions (not needing restore)
    const activeSessionCount = sessions.filter((s) => !s.needsRestore).length;
    // Only clean up after restoration is complete
    if (mountedTerminals.length > 0 && activeSessionCount > 0 && activeSessionCount < mountedTerminals.length) {
      setMountedTerminals((prev) => prev.slice(0, activeSessionCount || 1));
    }
  }, [sessions, mountedTerminals.length]);

  // Reset initialization flag when panel is hidden
  useEffect(() => {
    if (!visible) {
      hasInitialized.current = false;
    }
  }, [visible]);

  if (!visible) return null;

  // Determine which terminals to show
  const hasNoTerminals = mountedTerminals.length === 0;
  const isRightPosition = position === "right";

  // Style based on position
  const panelStyle = isRightPosition
    ? { width, height: "100%" }
    : { height, width: "100%" };

  const panelClassName = `terminal-panel terminal-panel--${position}`;

  // Get the active session and check if it has a split
  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const hasSplit = activeSession?.splitWith && activeSession?.splitDirection;
  const splitSibling = hasSplit
    ? sessions.find((s) => s.id === activeSession.splitWith)
    : null;

  return (
    <div className={panelClassName} style={panelStyle}>
      {/* Resize handle - position depends on panel position */}
      <div
        className={`terminal-resize-handle terminal-resize-handle--${position}`}
        onMouseDown={handleResizeStart}
      />

      {/* Tabs bar - only show when we have sessions */}
      {sessions.length > 0 && (
        <TerminalTabs
          onNewSession={handleNewSession}
          onCloseSession={handleCloseSession}
          onSplitSession={handleSplitSession}
        />
      )}

      {/* Terminal views */}
      <div className="terminal-content">
        {/* If active session has a split, render split layout */}
        {hasSplit && splitSibling ? (
          <div
            className={`terminal-split terminal-split--${activeSession!.splitDirection}`}
          >
            {/* Primary terminal */}
            <div className="terminal-split-pane">
              {mountedTerminals.map((mounted, index) => {
                const session = sessions[index];
                if (session?.id !== activeSessionId) return null;
                return (
                  <div key={mounted.key} className="terminal-session">
                    <TerminalView sessionToRestore={mounted.sessionToRestore} />
                  </div>
                );
              })}
            </div>
            {/* Split divider */}
            <div className="terminal-split-divider" />
            {/* Secondary terminal */}
            <div className="terminal-split-pane">
              {mountedTerminals.map((mounted, index) => {
                const session = sessions[index];
                if (session?.id !== splitSibling.id) return null;
                return (
                  <div key={mounted.key} className="terminal-session">
                    <TerminalView sessionToRestore={mounted.sessionToRestore} />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Normal single terminal view */
          mountedTerminals.map((mounted, index) => {
            const session = sessions[index];
            const isActive = session?.id === activeSessionId || hasNoTerminals;

            return (
              <div
                key={mounted.key}
                className="terminal-session"
                style={{ display: isActive ? "flex" : "none" }}
              >
                <TerminalView sessionToRestore={mounted.sessionToRestore} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
