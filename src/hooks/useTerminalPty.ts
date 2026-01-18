import { useEffect, useCallback, useRef, type MutableRefObject } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useTerminalStore, type TerminalSession } from "@/stores/terminalStore";
import { useSettingsStore } from "@/stores/settingsStore";
import type { Terminal } from "@xterm/xterm";

interface PtySession {
  id: string;
  cols: number;
  rows: number;
}

interface PtyOutput {
  sessionId: string;
  data: string;
}

interface PtyExit {
  sessionId: string;
  code: number | null;
}

/**
 * Hook to manage PTY connection for a terminal session.
 *
 * IMPORTANT: This hook uses empty deps [] to ensure PTY lifecycle is tied
 * to component mount/unmount only. All values are accessed via refs to get
 * the latest version without triggering effect re-runs. This prevents the
 * PTY from being killed when parent components re-render (e.g., visibility toggle).
 *
 * Handles:
 * - Spawning PTY session on mount (once per component lifetime)
 * - Forwarding PTY output to xterm.js
 * - Sending user input to PTY
 * - Restoring sessions from persistence
 * - Cleaning up on unmount only
 *
 * @param terminalRef - Reference to the xterm.js Terminal instance
 * @param processData - Optional function to process data before writing to terminal
 * @param onSessionCreated - Callback when PTY session is created
 * @param onSessionEnded - Callback when PTY session ends
 * @param sessionToRestore - Optional session to restore (will update ID instead of creating new)
 */
export function useTerminalPty(
  terminalRef: MutableRefObject<Terminal | null>,
  processData?: (data: string) => string,
  onSessionCreated?: (sessionId: string) => void,
  onSessionEnded?: (sessionId: string) => void,
  sessionToRestore?: TerminalSession
) {
  const rootPath = useWorkspaceStore((state) => state.rootPath);
  const sessionIdRef = useRef<string | null>(null);
  const unlistenOutputRef = useRef<UnlistenFn | null>(null);
  const unlistenExitRef = useRef<UnlistenFn | null>(null);
  const spawnedRef = useRef(false);

  // Use refs for callbacks to always have latest version
  const processDataRef = useRef(processData);
  const onSessionCreatedRef = useRef(onSessionCreated);
  const onSessionEndedRef = useRef(onSessionEnded);
  const rootPathRef = useRef(rootPath);
  const sessionToRestoreRef = useRef(sessionToRestore);

  // Keep refs up to date
  processDataRef.current = processData;
  onSessionCreatedRef.current = onSessionCreated;
  onSessionEndedRef.current = onSessionEnded;
  rootPathRef.current = rootPath;
  sessionToRestoreRef.current = sessionToRestore;

  // Send input to PTY
  const sendInput = useCallback((data: string) => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;

    invoke("pty_write", { sessionId, data }).catch((err) => {
      console.error("[PTY] Write error:", err);
    });
  }, []);

  // Resize PTY
  const resizePty = useCallback((cols: number, rows: number) => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;

    invoke("pty_resize", { sessionId, cols, rows }).catch((err) => {
      console.error("[PTY] Resize error:", err);
    });
  }, []);

  // Spawn PTY - runs once on mount, uses refs for values
  useEffect(() => {
    // Only spawn once per component lifetime
    if (spawnedRef.current) {
      return;
    }
    spawnedRef.current = true;

    const spawnPty = async () => {
      try {
        // Get shell setting
        const shellSetting = useSettingsStore.getState().terminal.shell;
        const shell = shellSetting === "system" ? undefined : shellSetting;

        // Use session cwd for restoration, otherwise use workspace root
        const cwd = sessionToRestoreRef.current?.cwd || rootPathRef.current || undefined;

        // Get terminal dimensions (use actual size if available, fallback to defaults)
        const cols = terminalRef.current?.cols ?? 80;
        const rows = terminalRef.current?.rows ?? 24;

        // Spawn PTY
        const session = await invoke<PtySession>("pty_spawn", {
          cwd,
          cols,
          rows,
          shell,
        });

        sessionIdRef.current = session.id;

        // Resize PTY to actual terminal dimensions now that session exists
        if (terminalRef.current) {
          const { cols, rows } = terminalRef.current;
          if (cols !== session.cols || rows !== session.rows) {
            invoke("pty_resize", { sessionId: session.id, cols, rows }).catch((err) => {
              console.error("[PTY] Initial resize error:", err);
            });
          }
        }

        // If restoring a session, update its ID instead of creating new
        if (sessionToRestoreRef.current) {
          useTerminalStore.getState().updateSessionId(sessionToRestoreRef.current.id, session.id);
        } else {
          onSessionCreatedRef.current?.(session.id);
        }

        // Listen for PTY output
        unlistenOutputRef.current = await listen<PtyOutput>("pty:output", (event) => {
          if (event.payload.sessionId !== sessionIdRef.current) return;
          // Process data through markdown filter if available
          const data = processDataRef.current
            ? processDataRef.current(event.payload.data)
            : event.payload.data;
          terminalRef.current?.write(data);
        });

        // Listen for PTY exit
        unlistenExitRef.current = await listen<PtyExit>("pty:exit", (event) => {
          if (event.payload.sessionId !== sessionIdRef.current) return;

          const exitCode = event.payload.code;
          terminalRef.current?.writeln("");
          terminalRef.current?.writeln(
            `\x1b[90m[Process exited with code ${exitCode ?? "unknown"}]\x1b[0m`
          );

          const endedSessionId = sessionIdRef.current;
          sessionIdRef.current = null;
          if (endedSessionId) {
            onSessionEndedRef.current?.(endedSessionId);
          }
        });
      } catch (err) {
        console.error("[PTY] Spawn error:", err);
        terminalRef.current?.writeln(
          `\x1b[31mError: Failed to start terminal: ${err}\x1b[0m`
        );
      }
    };

    spawnPty();

    // Cleanup only on true unmount (empty deps = only runs on unmount)
    return () => {
      // Cleanup listeners
      if (unlistenOutputRef.current) {
        unlistenOutputRef.current();
        unlistenOutputRef.current = null;
      }
      if (unlistenExitRef.current) {
        unlistenExitRef.current();
        unlistenExitRef.current = null;
      }

      // Kill PTY session
      const sessionId = sessionIdRef.current;
      if (sessionId) {
        invoke("pty_kill", { sessionId }).catch((err) => {
          console.error("[PTY] Kill error:", err);
        });
        sessionIdRef.current = null;
      }
    };
  // Empty deps - only run on mount/unmount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    sessionId: sessionIdRef.current,
    sendInput,
    resizePty,
  };
}

/**
 * Hook to use the terminal store for session management.
 * Returns functions to add/remove sessions from the store.
 */
export function useTerminalSessions() {
  const addSession = useTerminalStore((state) => state.addSession);
  const removeSession = useTerminalStore((state) => state.removeSession);
  const rootPath = useWorkspaceStore((state) => state.rootPath);

  const createSession = useCallback(
    (sessionId: string) => {
      addSession({
        id: sessionId,
        title: `Terminal ${useTerminalStore.getState().sessions.length + 1}`,
        cwd: rootPath || undefined,
        createdAt: Date.now(),
      });
    },
    [addSession, rootPath]
  );

  return { createSession, removeSession };
}
